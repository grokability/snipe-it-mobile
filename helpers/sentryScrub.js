const SENSITIVE_KEY = /^(authorization|token|access_token|refresh_token|api_token|client_secret|code|code_verifier|password|secret)$/i;
const BEARER_VALUE = /^\s*bearer\s+\S+/i;
const REDACTED = '[redacted]';
const MAX_DEPTH = 8;

export function stripHost(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)[^\s/?#]*/g, '$1[host]');
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
        return BEARER_VALUE.test(value) ? REDACTED : stripHost(value);
    }

    return value;
}

export function scrubEvent(event) {
    if (event.request) {
        if (event.request.headers) event.request.headers = redact(event.request.headers);
        if (event.request.url) event.request.url = stripHost(event.request.url);
        if (event.request.data) event.request.data = redact(event.request.data);
    }
    if (event.extra) event.extra = redact(event.extra);
    if (event.contexts) event.contexts = redact(event.contexts);

    if (typeof event.message === 'string') event.message = stripHost(event.message);
    if (typeof event.logentry?.message === 'string') {
        event.logentry.message = stripHost(event.logentry.message);
    }

    for (const exception of event.exception?.values ?? []) {
        if (typeof exception.value === 'string') exception.value = stripHost(exception.value);
        // A Metro dev bundle is served over the LAN, so frame filenames carry an address.
        for (const frame of exception.stacktrace?.frames ?? []) {
            if (typeof frame.filename === 'string') frame.filename = stripHost(frame.filename);
        }
    }

    for (const breadcrumb of event.breadcrumbs ?? []) scrubBreadcrumb(breadcrumb);

    return event;
}

export function scrubBreadcrumb(breadcrumb) {
    if (breadcrumb?.data) {
        breadcrumb.data = redact(breadcrumb.data);
        if (typeof breadcrumb.data.url === 'string') {
            breadcrumb.data.url = stripHost(breadcrumb.data.url);
        }
    }
    if (typeof breadcrumb?.message === 'string') {
        breadcrumb.message = stripHost(breadcrumb.message);
    }
    return breadcrumb;
}
