// Turns what the user typed into the Snipe-IT instance base URL that every login request is
// built from, or says why it cannot. This is the only parser of the typed domain: domainShape
// describes the URL returned here rather than splitting the input itself.
//
// URL is Expo's whatwg-url-minimum (expo/src/winter/url.ts), which does the parsing. The base
// URL is built from origin and path only, so credentials, a query string or a fragment the user
// typed are dropped, and the rewritten field shows it.

const SUPPORTED_PROTOCOLS = ['http:', 'https:'];

function parse(text) {
    try {
        return new URL(text);
    } catch {
        return null;
    }
}

function failure(error) {
    return { baseUrl: null, url: null, addedScheme: false, error };
}

export function normalizeDomain(domain) {
    const trimmed = typeof domain === 'string' ? domain.trim() : '';
    if (trimmed === '') return failure('blank');

    // "snipe.local:8182" parses as the scheme "snipe.local:", so anything that is not http or
    // https is retried as a schemeless host unless the user clearly typed a scheme.
    let url = parse(trimmed);
    let addedScheme = false;
    if (!SUPPORTED_PROTOCOLS.includes(url?.protocol) && !trimmed.includes('://')) {
        url = parse(`https://${trimmed}`);
        addedScheme = true;
    }
    if (!SUPPORTED_PROTOCOLS.includes(url?.protocol)) return failure('invalid-url');

    // Kept without a trailing slash so one instance has one base URL, and a deployment path
    // such as /snipeit survives.
    const baseUrl = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
    return { baseUrl, url: new URL(baseUrl), addedScheme, error: null };
}
