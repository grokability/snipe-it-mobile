// Describes the shape of a user's Snipe-IT domain without disclosing the domain itself.
//
// Discussions #165 and #166 are both self-hosted instances that the app cannot reach, and
// the reporters tried "all combinations of url/ip and https/http" without us ever learning
// which combination they actually used. These fields answer that question. None of them
// identify the host: they describe the form of the input, not its value.
//
// Everything here reads the URL normalizeDomain produces. `scheme_added` records that the user
// typed no scheme and https:// was assumed.

import { normalizeDomain } from '@/helpers/normalizeDomain';

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
    if (ipv4) return { host_type: 'ipv4', address_range: classifyIpv4(ipv4.slice(1, 5).map(Number)) };

    if (lower === 'localhost') return { host_type: 'localhost', address_range: 'loopback' };
    // A .local name resolves over mDNS, which behaves differently from normal DNS on device.
    if (lower.endsWith('.local')) return { host_type: 'mdns-local', address_range: 'link-local' };
    if (!lower.includes('.')) return { host_type: 'unqualified-hostname', address_range: 'none' };
    return { host_type: 'hostname', address_range: 'none' };
}

// The bare host a native error message would name, lowercased. Null when the domain did not
// normalize, since no request is made for it.
export function parseHost(domain) {
    return normalizeDomain(domain).url?.hostname ?? null;
}

export function describeDomain(domain) {
    const { url, addedScheme, error } = normalizeDomain(domain);
    if (error) {
        return { scheme: 'none', host_type: 'none', address_range: 'none', port: null, has_path: false, scheme_added: false, validation_error: error };
    }

    return {
        scheme: url.protocol.slice(0, -1),
        ...classifyHost(url.hostname),
        // The port number is not identifying and distinguishes a reverse-proxied instance
        // from one served directly.
        port: url.port === '' ? null : url.port,
        has_path: url.pathname !== '/',
        scheme_added: addedScheme,
        validation_error: null,
    };
}

// A cleartext request to anything other than a local address is blocked outright by iOS App
// Transport Security, and by Android's default network security config. Both surface as an
// indistinguishable transport failure, so flag the condition rather than trying to detect it.
export function isLikelyCleartextBlocked({ scheme, address_range, host_type }) {
    if (scheme !== 'http') return false;
    return address_range === 'public' || host_type === 'hostname';
}
