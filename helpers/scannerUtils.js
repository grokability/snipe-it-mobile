const HARDWARE_ID_PATTERN = /\/hardware\/([^/?#]+)/;
const LOCATION_ID_PATTERN = /\/location\/([^/?#]+)/;
//etc

export function extractIdFromScannedData(data) {
    try {
        const url = new URL(data);
        const hardwareMatch = url.pathname.match(HARDWARE_ID_PATTERN);
        if (hardwareMatch) {
            return { id: hardwareMatch[1], url };
        }
        const segments = url.pathname.split('/');
        return { id: segments[segments.length - 1], url };
    } catch {
        return { id: data, url: null };
    }
}

export function isScannedUrlForCurrentInstance(url, storedDomain) {
    if (!url || !storedDomain) return true;
    try {
        return url.origin === new URL(storedDomain).origin;
    } catch {
        return true;
    }
}
