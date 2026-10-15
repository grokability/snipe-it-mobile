import { makeRequest } from "@/helpers/axiosConfig";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

const HARDWARE_ID_PATTERN = /\/hardware\/([^/?#]+)/;

// Snipe-IT URLs a scanned QR code can hold: a label's 2D target (app/View/Label.php) or the QR
// code on an object's page (QrCodeController). Database IDs are numeric; an /ht/ tag can be any text.
const SCANNED_URL_PATTERNS = [
    { kind: 'assetId', pattern: /\/hardware\/(\d+)(?:\/|$)/ },
    { kind: 'assetTag', pattern: /\/ht\/([^/]+)/ },
    { kind: 'accessoryId', pattern: /\/accessories\/(\d+)(?:\/|$)/ },
    { kind: 'consumableId', pattern: /\/consumables\/(\d+)(?:\/|$)/ },
    { kind: 'location', pattern: /\/locations\/(\d+)(?:\/|$)/ },
];

// Partitions expo-camera's BarcodeType union. Snipe-IT always encodes the asset tag in a 1D
// barcode, while a 2D code can hold a URL or a plain value, so the two are looked up differently.
// A type missing from both lists (e.g. one added in a future SDK) is 'unknown' rather than guessed.
const BARCODE_TYPES_2D = new Set(['qr', 'datamatrix', 'aztec', 'pdf417']);
const BARCODE_TYPES_1D = new Set(['code128', 'code39', 'code93', 'codabar', 'ean13', 'ean8', 'itf14', 'upc_a', 'upc_e']);

export function classifyBarcodeSymbology(type) {
    if (BARCODE_TYPES_2D.has(type)) {
        return '2d';
    }

    if (BARCODE_TYPES_1D.has(type)) {
        return '1d';
    }

    return 'unknown';
}

// Describes what a scanned code points at without looking anything up; the kind picks the lookup.
// A 1D barcode is always an asset tag. A 2D code that isn't an http(s) URL is a plain value that
// could be a tag or a serial ('ambiguous'). url is set for http(s) codes so the caller can check
// which Snipe-IT instance they belong to.
export function parseScannedCode(data, symbology) {
    if (symbology === '1d') {
        return { kind: 'assetTag', value: data, url: null };
    }

    const url = parseHttpUrl(data);

    if (!url) {
        return { kind: 'ambiguous', value: data, url: null };
    }

    for (const { kind, pattern } of SCANNED_URL_PATTERNS) {
        const match = url.pathname.match(pattern);

        if (match) {
            return { kind, value: decodePathSegment(match[1]), url };
        }
    }

    return { kind: 'unknown', value: data, url };
}

function parseHttpUrl(data) {
    try {
        const url = new URL(data);
        return (url.protocol === 'http:' || url.protocol === 'https:') ? url : null;
    } catch {
        return null;
    }
}

// An /ht/ tag arrives percent-encoded; a malformed escape is left as scanned rather than thrown
function decodePathSegment(segment) {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

const ASSET_LOOKUP_URLS = {
    assetId: (id) => `/hardware/${encodeURIComponent(id)}`,
    assetTag: (tag) => `/hardware/bytag/${encodeURIComponent(tag)}`,
    ambiguous: (tag) => `/hardware/bytag/${encodeURIComponent(tag)}`,
};

// Looks up the asset a scanned code refers to and says what happened, so the scanner can show the
// right message: 'found' (with the asset), 'notFound', 'notAsset' for accessory, consumable,
// location and unrecognized codes, or 'otherInstance' for a URL from a different Snipe-IT server.
// Request errors are thrown, including PermissionDeniedError: not being allowed to view assets
// isn't the same as the asset not existing.
export async function resolveScannedAsset(data, symbology, storedDomain) {
    const { kind, value, url } = parseScannedCode(data, symbology);

    if (!isScannedUrlForCurrentInstance(url, storedDomain)) {
        return { outcome: 'otherInstance' };
    }

    const lookupUrl = ASSET_LOOKUP_URLS[kind];

    if (!lookupUrl) {
        return { outcome: 'notAsset', kind, value };
    }

    const response = await makeRequest({ url: lookupUrl(value), method: 'get', permissionKey: PERMISSIONS.ASSETS_VIEW, silent: true });

    if (!response || response.status === 'error') {
        return { outcome: 'notFound', kind, value };
    }

    return { outcome: 'found', asset: response };
}

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

// Resolves a scanned barcode's asset_tag via the API. Returns null for codes that don't
// resolve to an id, or that belong to a different Snipe-IT instance than storedDomain —
// an id from another instance could otherwise resolve to the wrong asset here.
export async function fetchAssetTagForBarcode(data, storedDomain) {
    const { id, url } = extractIdFromScannedData(data);
    if (!id || !isScannedUrlForCurrentInstance(url, storedDomain)) return null;

    const asset = await makeRequest({ url: `/hardware/${id}`, method: 'get', permissionKey: PERMISSIONS.ASSETS_VIEW, silent: true });
    return (asset && asset.status !== 'error' && asset.asset_tag) ? asset.asset_tag : null;
}
