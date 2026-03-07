import { getDatabase } from './database';

const TTL = {
    audit_due: 60 * 60 * 1000,      // 1 hour
    audit_overdue: 60 * 60 * 1000,   // 1 hour
    index: 2 * 60 * 60 * 1000,      // 2 hours
    fetch: 4 * 60 * 60 * 1000,      // 4 hours
};

function extractAssetFields(asset) {
    return {
        id: asset.id,
        asset_tag: asset.asset_tag,
        name: asset.name || null,
        serial: asset.serial || null,
        image_url: asset.image || null,
        model_id: asset.model?.id || null,
        model_name: asset.model?.name || null,
        location_id: asset.location?.id || null,
        location_name: asset.location?.name || null,
        status_name: asset.status_label?.name || null,
        status_type: asset.status_label?.status_type || null,
        assigned_to_name: asset.assigned_to?.name || null,
        last_audit_date: asset.last_audit_date?.formatted || asset.last_audit_date?.date?.substring(0, 10) || null,
        next_audit_date: asset.next_audit_date?.formatted || asset.next_audit_date?.date?.substring(0, 10) || null,
    };
}

export async function cacheAssets(assets, source) {
    try {
        const db = await getDatabase();
        const now = new Date().toISOString();

        for (const asset of assets) {
            const fields = extractAssetFields(asset);
            await db.runAsync(
                `INSERT OR REPLACE INTO assets
                    (id, asset_tag, name, serial, image_url, model_id, model_name,
                     location_id, location_name, status_name, status_type, assigned_to_name,
                     last_audit_date, next_audit_date, json_data, cached_at, source)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    fields.id, fields.asset_tag, fields.name, fields.serial,
                    fields.image_url, fields.model_id, fields.model_name,
                    fields.location_id, fields.location_name, fields.status_name,
                    fields.status_type, fields.assigned_to_name,
                    fields.last_audit_date, fields.next_audit_date,
                    JSON.stringify(asset), now, source,
                ]
            );
        }

        await db.runAsync(
            `INSERT OR REPLACE INTO cache_meta (key, last_synced_at, total_items)
             VALUES (?, ?, ?)`,
            [source, now, assets.length]
        );
    } catch (err) {
        console.error('cacheAssets error:', err);
    }
}

export async function cacheAsset(asset, source = 'fetch') {
    return cacheAssets([asset], source);
}

export async function getCachedAssets(source) {
    try {
        const db = await getDatabase();
        const rows = await db.getAllAsync(
            'SELECT json_data, cached_at FROM assets WHERE source = ? ORDER BY next_audit_date ASC',
            [source]
        );
        return rows.map((row) => ({
            ...JSON.parse(row.json_data),
            _cachedAt: row.cached_at,
        }));
    } catch (err) {
        console.error('getCachedAssets error:', err);
        return [];
    }
}

export async function getCachedAssetByTag(assetTag) {
    try {
        const db = await getDatabase();
        const row = await db.getFirstAsync(
            'SELECT json_data, cached_at FROM assets WHERE asset_tag = ? ORDER BY cached_at DESC LIMIT 1',
            [assetTag]
        );
        if (!row) return null;
        return {
            ...JSON.parse(row.json_data),
            _cachedAt: row.cached_at,
        };
    } catch (err) {
        console.error('getCachedAssetByTag error:', err);
        return null;
    }
}

export async function getCachedAssetById(assetId) {
    try {
        const db = await getDatabase();
        const row = await db.getFirstAsync(
            'SELECT json_data, cached_at FROM assets WHERE id = ? ORDER BY cached_at DESC LIMIT 1',
            [assetId]
        );
        if (!row) return null;
        return {
            ...JSON.parse(row.json_data),
            _cachedAt: row.cached_at,
        };
    } catch (err) {
        console.error('getCachedAssetById error:', err);
        return null;
    }
}

export async function getCacheMeta(key) {
    try {
        const db = await getDatabase();
        return await db.getFirstAsync(
            'SELECT * FROM cache_meta WHERE key = ?',
            [key]
        );
    } catch (err) {
        console.error('getCacheMeta error:', err);
        return null;
    }
}

export function isCacheStale(cachedAt, source) {
    if (!cachedAt) return true;
    const ttl = TTL[source] || TTL.fetch;
    const age = Date.now() - new Date(cachedAt).getTime();
    return age > ttl;
}

export function getCacheAge(cachedAt) {
    if (!cachedAt) return null;
    return Date.now() - new Date(cachedAt).getTime();
}

export function getCacheAgeColor(cachedAt) {
    const age = getCacheAge(cachedAt);
    if (!age) return null;
    if (age < 60 * 60 * 1000) return 'success';         // < 1 hour: green
    if (age < 4 * 60 * 60 * 1000) return 'warning';     // 1-4 hours: yellow
    return 'danger';                                      // > 4 hours: red
}

export function formatCacheAge(cachedAt) {
    const age = getCacheAge(cachedAt);
    if (!age) return null;
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
