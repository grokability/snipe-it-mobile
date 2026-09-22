// Longest first, so a shorter name cannot claim a longer one's prefix while the engine is
// working through the alternation.
const SENSITIVE_KEYS = [
    'authorization',
    'code_verifier',
    'client_secret',
    'refresh_token',
    'access_token',
    'api_token',
    'password',
    'secret',
    'token',
    'code',
];
const KEY_ALTERNATION = SENSITIVE_KEYS.join('|');

const SENSITIVE_KEY = new RegExp(`^(?:${KEY_ALTERNATION})$`, 'i');
const BEARER_VALUE = /^\s*bearer\s+\S+/i;

// A request body is already serialized by the time a failed request is reported, so the
// key-by-key redaction below never sees inside it: the OAuth token exchange posts
// `grant_type=...&code=...&code_verifier=...` as a single string. The same is true of a
// redirect URL carrying `?code=` in its query.
const SENSITIVE_FORM_PAIR = new RegExp(`(^|[?&])(${KEY_ALTERNATION})=[^&#\\s]*`, 'gi');
const SENSITIVE_JSON_PAIR = new RegExp(`("(?:${KEY_ALTERNATION})"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`, 'gi');

const REDACTED = '[redacted]';
const MAX_DEPTH = 8;

// Hosts the app itself links to. They are the same for every install and say nothing about
// who is running it, so blanking them only costs legibility: a report reading "Unable to open
// URL: https://[host]/grokability/snipe-it-mobile/discussions/new" hides the one detail that
// makes it actionable. Anything not listed here is treated as the user's Snipe-IT instance.
//
// ^this isn't exactly true, there's a possibility that user data includes hosts that users will want to 
// open, so we'll probably need to revisit this in the future, but for right now to get this working it's fine
const PUBLIC_HOSTS = new Set(['github.com', 'discord.gg', 'docs.expo.dev']);

// `authority` is the [userinfo@]host[:port] between the scheme and the path.
function isPublicHost(authority) {
    // Userinfo can carry credentials, so a URL that has any is never kept, whatever the host.
    if (authority.includes('@')) return false;

    const host = authority.toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
    return PUBLIC_HOSTS.has(host);
}

export function stripHost(text) {
    if (typeof text !== 'string') return text;
    return text.replace(
        /([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^\s/?#]*)/g,
        (url, scheme, authority) => (isPublicHost(authority) ? url : `${scheme}[host]`)
    );
}

// stripHost only sees a host that follows a scheme, and native network errors name one
// without it: "CLEARTEXT communication to 192.168.20.200 not permitted". A hostname in free
// text cannot be told apart from an ordinary word, so the host the user typed is replaced by
// value in loginTelemetry. An IPv4 literal can be matched by pattern, and this also
// catches one the user never typed, such as the target of a redirect.
const IPV4_LITERAL = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(:\d{1,5})?\b/g;

function stripAddressLiterals(text) {
    return text.replace(IPV4_LITERAL, (literal, ...octets) =>
        (octets.slice(0, 4).every((octet) => Number(octet) <= 255) ? '[host]' : literal));
}

function stripSerializedSecrets(text) {
    return text
        .replace(SENSITIVE_FORM_PAIR, (pair, lead, key) => `${lead}${key}=${REDACTED}`)
        .replace(SENSITIVE_JSON_PAIR, (pair, prefix) => `${prefix}"${REDACTED}"`);
}

// Everything that reaches Sentry as free text goes through here rather than stripHost alone:
// a host is not the only thing worth hiding in a string.
export function scrubText(text) {
    if (typeof text !== 'string') return text;
    return stripSerializedSecrets(stripAddressLiterals(stripHost(text)));
}

export function redact(value, depth = 0) {
    if (value == null || depth > MAX_DEPTH) return value;

    if (Array.isArray(value)) {
        return value.map((entry) => redact(entry, depth + 1));
    }

    if (typeof value === 'object') {
        const output = {};
        for (const [key, entry] of Object.entries(value)) {
            output[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(entry, depth + 1);
        }
        return output;
    }

    if (typeof value === 'string') {
        return BEARER_VALUE.test(value) ? REDACTED : scrubText(value);
    }

    return value;
}

export function scrubEvent(event) {
    if (event.request) {
        if (event.request.headers) event.request.headers = redact(event.request.headers);
        if (event.request.url) event.request.url = scrubText(event.request.url);
        if (event.request.data) event.request.data = redact(event.request.data);
    }
    // failure_reason carries the native error message verbatim, host and all.
    if (event.tags) event.tags = redact(event.tags);
    if (event.extra) event.extra = redact(event.extra);
    if (event.contexts) event.contexts = redact(event.contexts);

    if (typeof event.message === 'string') event.message = scrubText(event.message);
    if (typeof event.logentry?.message === 'string') {
        event.logentry.message = scrubText(event.logentry.message);
    }

    for (const exception of event.exception?.values ?? []) {
        if (typeof exception.value === 'string') exception.value = scrubText(exception.value);
        if (exception.mechanism?.data) exception.mechanism.data = redact(exception.mechanism.data);
        // A Metro dev bundle is served over the LAN, so frame filenames carry an address.
        for (const frame of exception.stacktrace?.frames ?? []) {
            if (typeof frame.filename === 'string') frame.filename = scrubText(frame.filename);
        }
    }

    for (const breadcrumb of event.breadcrumbs ?? []) scrubBreadcrumb(breadcrumb);

    return event;
}

export function scrubBreadcrumb(breadcrumb) {
    if (breadcrumb?.data) {
        breadcrumb.data = redact(breadcrumb.data);
        if (typeof breadcrumb.data.url === 'string') {
            breadcrumb.data.url = scrubText(breadcrumb.data.url);
        }
    }
    if (typeof breadcrumb?.message === 'string') {
        breadcrumb.message = scrubText(breadcrumb.message);
    }
    return breadcrumb;
}
