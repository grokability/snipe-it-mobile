import * as SecureStore from 'expo-secure-store';
import debounce from 'lodash/debounce';
import { PERMISSIONS } from './PermissionKeys';

const STORAGE_PREFIX = 'permissionStates.v1.';
const SCHEMA_VERSION = 1;

// SecureStore keys must be alphanumeric plus '.', '-', '_'.
// Strip the protocol and replace any remaining disallowed characters.
function storageKey(domain) {
    const sanitized = domain.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${STORAGE_PREFIX}${sanitized}`;
}

let activeDomain = null;
let activeUserId = null;
let superuser = false;
let endpointV2Available = false;
// Keys are permission strings (e.g. 'assets.view'). Only 'allowed' and 'denied' are
// stored explicitly — a missing key is treated as 'unknown' everywhere.
let permissionStates = {};
let source = {};  // 'usersMe' | 'discovery403' | 'discoverySuccess' | 'endpointV2'
const subscribers = new Set();

function notify() {
    subscribers.forEach(fn => fn());
}


// debounces SecureStore writes when we're setting a lot at once (like at login)
const secureStoreUpdater = debounce(() => {
    if (!activeDomain) return;
    SecureStore.setItemAsync(storageKey(activeDomain), JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        userId: activeUserId,
        superuser,
        endpointV2Available,
        permissionStates,
        source,
    }));
}, 300);

export const PermissionManager = {
    async hydrate(domain) {
        activeDomain = domain;
        try {
            const raw = await SecureStore.getItemAsync(storageKey(domain));
            if (!raw) return;
            const stored = JSON.parse(raw);
            if (stored.schemaVersion !== SCHEMA_VERSION) {
                await SecureStore.deleteItemAsync(storageKey(domain));
                return;
            }
            activeUserId = stored.userId ?? null;
            superuser = stored.superuser ?? false;
            endpointV2Available = stored.endpointV2Available ?? false;
            permissionStates = stored.permissionStates ?? {};
            source = stored.source ?? {};
            notify();
        } catch {
            await SecureStore.deleteItemAsync(storageKey(domain));
        }
    },

    initializeFromUsersMe(perms, userId, domain) {
        if (domain !== activeDomain) {
            activeDomain = domain;
            permissionStates = {};
            source = {};
        }
        // Different user on the same server — discard discovered permissionStates
        if (activeUserId !== null && activeUserId !== userId) {
            permissionStates = {};
            source = {};
        }
        activeUserId = userId;
        superuser = perms?.superuser === 1;

        if (perms) {
            for (const [key, rawValue] of Object.entries(perms)) {
                const value = typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10);
                if (value === 1) {
                    permissionStates[key] = 'allowed';
                    source[key] = 'usersMe';
                } else if (value === -1) {
                    permissionStates[key] = 'denied';
                    source[key] = 'usersMe';
                } else {
                    // value === 0 (inherited/ambiguous)
                    // if we previously recorded a 403 for this key but the
                    // server now says inherited, give the user the benefit of the doubt.
                    if (source[key] === 'discovery403') {
                        delete permissionStates[key];
                        delete source[key];
                    }
                    // Otherwise leave the existing state — a discoverySuccess 'allowed' remains.
                }
            }
        }

        secureStoreUpdater();
        notify();
    },

    recordDeny(key) {
        if (!activeDomain || superuser) return;
        if (permissionStates[key] === 'denied') return;
        permissionStates[key] = 'denied';
        source[key] = 'discovery403';
        secureStoreUpdater();
        notify();
    },

    // Only promotes unknown → allowed. Does not override any existing denied state.
    recordAllow(key) {
        if (!activeDomain) return;
        if (permissionStates[key]) return; // already 'allowed' or 'denied' — do not change
        permissionStates[key] = 'allowed';
        source[key] = 'discoverySuccess';
        secureStoreUpdater();
        notify();
    },

    get(key) {
        if (superuser) return 'allowed';
        return permissionStates[key] ?? 'unknown';
    },

    // Returns true for 'allowed' and 'unknown' (optimistic — show button unless explicitly denied)
    isAllowed(key) {
        if (superuser) return true;
        return permissionStates[key] !== 'denied';
    },

    isKnownDenied(key) {
        if (superuser) return false;
        return permissionStates[key] === 'denied';
    },

    subscribe(fn) {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
    },

    getCurrentDomain() {
        return activeDomain;
    },

    reset(domain) {
        if (activeDomain === domain) {
            activeDomain = null;
            activeUserId = null;
            superuser = false;
            endpointV2Available = false;
            permissionStates = {};
            source = {};
            secureStoreUpdater.cancel();
            notify();
        }
        SecureStore.deleteItemAsync(storageKey(domain));
    },

    async refreshPermissions(domain, token) {
        try {
            const response = await fetch(`${domain}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.permissions) {
                    PermissionManager.initializeFromUsersMe(data.permissions, data.id, domain);
                }
            }
        } catch {
            // Network error — leave existing state unchanged
        }
        await PermissionManager.probeViewPermissions(domain, token);
    },

    // Fires list-endpoint GETs at login to seed view permissions before the user navigates anywhere.
    async probeViewPermissions(domain, token) {
        const probes = [
            { key: PERMISSIONS.ASSETS_VIEW,       path: '/api/v1/hardware?limit=1' },
            { key: PERMISSIONS.ACCESSORIES_VIEW,   path: '/api/v1/accessories?limit=1' },
            { key: PERMISSIONS.CONSUMABLES_VIEW,   path: '/api/v1/consumables?limit=1' },
            { key: PERMISSIONS.LICENSES_VIEW,      path: '/api/v1/licenses?limit=1' },
            { key: PERMISSIONS.COMPONENTS_VIEW,    path: '/api/v1/components?limit=1' },
            { key: PERMISSIONS.REPORTS_VIEW,       path: '/api/v1/reports/activity?limit=1' },
        ];

        await Promise.allSettled(
            probes.map(async ({ key, path }) => {
                try {
                    const response = await fetch(`${domain}${path}`, {
                        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    });
                    if (response.status === 403) {
                        PermissionManager.recordDeny(key);
                    } else if (response.ok) {
                        PermissionManager.recordAllow(key);
                    }
                } catch {
                    // Network error — don't modify permission state
                }
            })
        );
    },
};
