// Describes the shape of a user's Snipe-IT domain without disclosing the domain itself.
//
// Discussions #165 and #166 are both self-hosted instances that the app cannot reach, and
// the reporters tried "all combinations of url/ip and https/http" without us ever learning
// which combination they actually used. These fields answer that question. None of them
// identify the host: they describe the form of the input, not its value.

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function classifyIpv4(octets) {
    const [a, b] = octets;
    if (a === 127) return 'loopback';
    if (a === 10) return 'private-10/8';
    if (a === 172 && b >= 16 && b <= 31) return 'private-172.16/12';
    if (a === 192 && b === 168) return 'private-192.168/16';
    if (a === 169 && b === 254) return 'link-local-169.254/16';
    return 'public';
}

function classifyHost(host) {
    const lower = host.toLowerCase();

    if (lower.startsWith('[') && lower.endsWith(']')) {
        return { host_type: 'ipv6', address_range: lower.startsWith('[fe80') ? 'link-local' : 'other' };
    }

    const ipv4 = lower.match(IPV4);
    if (ipv4) {
        const octets = ipv4.slice(1, 5).map(Number);
        if (octets.some((octet) => octet > 255)) {
            return { host_type: 'invalid-ipv4', address_range: 'none' };
        }
        return { host_type: 'ipv4', address_range: classifyIpv4(octets) };
    }

    if (lower === 'localhost') return { host_type: 'localhost', address_range: 'loopback' };
    // A .local name resolves over mDNS, which behaves differently from normal DNS on device.
    if (lower.endsWith('.local')) return { host_type: 'mdns-local', address_range: 'link-local' };
    if (!lower.includes('.')) return { host_type: 'unqualified-hostname', address_range: 'none' };
    return { host_type: 'hostname', address_range: 'none' };
}

export function describeDomain(domain) {
    if (typeof domain !== 'string' || domain.trim() === '') {
        return { scheme: 'empty', host_type: 'none', address_range: 'none' };
    }

    const raw = domain.trim();
    const schemeMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
    const scheme = schemeMatch ? schemeMatch[1].toLowerCase() : 'none';
    const afterScheme = schemeMatch ? raw.slice(schemeMatch[0].length) : raw;

    const firstSlash = afterScheme.indexOf('/');
    const authority = firstSlash === -1 ? afterScheme : afterScheme.slice(0, firstSlash);
    const path = firstSlash === -1 ? '' : afterScheme.slice(firstSlash);

    // Credentials embedded in the URL are their own problem; flag it without capturing it.
    const atIndex = authority.lastIndexOf('@');
    const hostAndPort = atIndex === -1 ? authority : authority.slice(atIndex + 1);

    let host = hostAndPort;
    let port = null;
    if (hostAndPort.startsWith('[')) {
        const close = hostAndPort.indexOf(']');
        if (close !== -1) {
            host = hostAndPort.slice(0, close + 1);
            const remainder = hostAndPort.slice(close + 1);
            if (remainder.startsWith(':')) port = remainder.slice(1);
        }
    } else {
        const colon = hostAndPort.lastIndexOf(':');
        if (colon !== -1) {
            host = hostAndPort.slice(0, colon);
            port = hostAndPort.slice(colon + 1);
        }
    }

    const { host_type, address_range } = classifyHost(host);

    return {
        scheme,
        host_type,
        address_range,
        // The port number is not identifying and distinguishes a reverse-proxied instance
        // from one served directly.
        port: port === null || port === '' ? null : port,
        has_path: path !== '' && path !== '/',
        has_trailing_slash: raw.endsWith('/'),
        has_embedded_credentials: atIndex !== -1,
        has_whitespace: /\s/.test(domain),
        host_label_count: host.includes('.') ? host.split('.').length : 1,
        length: raw.length,
    };
}

// A cleartext request to anything other than a local address is blocked outright by iOS App
// Transport Security, and by Android's default network security config. Both surface as an
// indistinguishable transport failure, so flag the condition rather than trying to detect it.
export function isLikelyCleartextBlocked({ scheme, address_range, host_type }) {
    if (scheme !== 'http') return false;
    return address_range === 'public' || host_type === 'hostname';
}
