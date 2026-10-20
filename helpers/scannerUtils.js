import { makeRequest } from "@/helpers/axiosConfig";
import { PERMISSIONS } from "@/permissions/PermissionKeys";
import { accessoryKeys, consumableKeys } from "@/helpers/queryKeys";

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

// matchedBy names the asset field each lookup searches, so the scanner can word its messages
const LOOKUP_BY_ID = { matchedBy: 'id', url: (id) => `/hardware/${encodeURIComponent(id)}` };
const LOOKUP_BY_TAG = { matchedBy: 'asset_tag', url: (tag) => `/hardware/bytag/${encodeURIComponent(tag)}?deleted=true` };
const LOOKUP_BY_SERIAL = { matchedBy: 'serial', url: (serial) => `/hardware/byserial/${encodeURIComponent(serial)}?deleted=true` };

// Lookups tried in order until one matches. A plain 2D value could be a tag or a serial, and is
// never tried as an ID: any number would then open whichever unrelated asset has that ID.
const ASSET_LOOKUPS = {
    assetId: [LOOKUP_BY_ID],
    assetTag: [LOOKUP_BY_TAG],
    ambiguous: [LOOKUP_BY_TAG, LOOKUP_BY_SERIAL],
};

// Reduces a lookup response to the assets the scan could mean. /hardware/{id} returns one asset
// object, soft-deleted or not. bytag and byserial are asked for deleted assets too, so they return
// {total, rows}; v6.0.0–v6.0.13 ignore ?deleted=true, returning a single live bytag object and
// always including deleted byserial rows. A deleted asset's tag or serial can be reused by a live
// one, so live matches win and deleted ones count only when nothing live does.
// The deleted assets a live match won over are kept as deletedMatches so the user can be told.
function scannedAssetCandidates(response) {
    if (!response || response.status === 'error') {
        return { candidates: [], deletedMatches: [] };
    }

    const assets = Array.isArray(response.rows) ? response.rows : [response];
    const liveAssets = assets.filter((asset) => !asset.deleted_at);

    if (liveAssets.length === 0) {
        return { candidates: assets, deletedMatches: [] };
    }

    return { candidates: liveAssets, deletedMatches: assets.filter((asset) => asset.deleted_at) };
}

// Looks up the asset a scanned code refers to and says what happened, so the scanner can show the
// right message: 'found' (with the asset, which is soft-deleted when it has a deleted_at, and any
// deletedMatches sharing its tag or serial), 'notFound', 'multiple' when several assets match,
// 'notAsset' for accessory, consumable, location and unrecognized codes, or 'otherInstance' for a
// URL from a different Snipe-IT server. 'found' and 'multiple' carry the matchedBy field. Request
// errors are thrown, including PermissionDeniedError: not being allowed to view assets isn't the
// same as the asset not existing.
export async function resolveScannedAsset(data, symbology, storedDomain) {
    const { kind, value, url } = parseScannedCode(data, symbology);

    if (!isScannedUrlForCurrentInstance(url, storedDomain)) {
        return { outcome: 'otherInstance' };
    }

    const lookups = ASSET_LOOKUPS[kind];

    if (!lookups) {
        return { outcome: 'notAsset', kind, value };
    }

    for (const { matchedBy, url: lookupUrl } of lookups) {
        const response = await makeRequest({ url: lookupUrl(value), method: 'get', permissionKey: PERMISSIONS.ASSETS_VIEW, silent: true });
        const { candidates, deletedMatches } = scannedAssetCandidates(response);

        if (candidates.length > 1) {
            return { outcome: 'multiple', kind, value, matchedBy };
        }

        if (candidates.length === 1) {
            return { outcome: 'found', asset: candidates[0], deletedMatches, matchedBy };
        }
    }

    return { outcome: 'notFound', kind, value };
}

// The overlay labels an accessory's or consumable's page QR code with the item's name
const ITEM_LOOKUPS = {
    accessoryId: {
        queryKey: accessoryKeys.detail,
        permissionKey: PERMISSIONS.ACCESSORIES_VIEW,
        url: (id) => `/accessories/${encodeURIComponent(id)}`,
    },
    consumableId: {
        queryKey: consumableKeys.detail,
        permissionKey: PERMISSIONS.CONSUMABLES_VIEW,
        url: (id) => `/consumables/${encodeURIComponent(id)}`,
    },
};

// Query options for the accessory or consumable a scan resolved to, under the key its detail
// screen reads, so opening the item after a scan needs no second request. Null for any other scan.
// The query throws PermissionDeniedError without the view permission.
export function scannedItemQueryOptions({ kind, value }) {
    const lookup = ITEM_LOOKUPS[kind];

    if (!lookup) {
        return null;
    }

    return {
        queryKey: lookup.queryKey(value),
        queryFn: () => makeRequest({ url: lookup.url(value), method: 'get', permissionKey: lookup.permissionKey, silent: true }),
    };
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
