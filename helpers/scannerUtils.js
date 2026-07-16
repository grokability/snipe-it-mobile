import { makeRequest } from "@/helpers/axiosConfig";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

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

// Resolves a scanned barcode's asset_tag via the API. Returns null for codes that don't
// resolve to an id, or that belong to a different Snipe-IT instance than storedDomain —
// an id from another instance could otherwise resolve to the wrong asset here.
export async function fetchAssetTagForBarcode(data, storedDomain) {
    const { id, url } = extractIdFromScannedData(data);
    if (!id || !isScannedUrlForCurrentInstance(url, storedDomain)) return null;

    const asset = await makeRequest({ url: `/hardware/${id}`, method: 'get', permissionKey: PERMISSIONS.ASSETS_VIEW, silent: true });
    return (asset && asset.status !== 'error' && asset.asset_tag) ? asset.asset_tag : null;
}
