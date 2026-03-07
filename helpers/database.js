import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDatabase() {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('snipeit_cache.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await runMigrations(db);
    return db;
}

async function runMigrations(database) {
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY,
            asset_tag TEXT NOT NULL,
            name TEXT,
            serial TEXT,
            image_url TEXT,
            model_id INTEGER,
            model_name TEXT,
            location_id INTEGER,
            location_name TEXT,
            status_name TEXT,
            status_type TEXT,
            assigned_to_name TEXT,
            last_audit_date TEXT,
            next_audit_date TEXT,
            json_data TEXT NOT NULL,
            cached_at TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'fetch'
        );

        CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON assets(asset_tag);
        CREATE INDEX IF NOT EXISTS idx_assets_next_audit ON assets(next_audit_date);
        CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source);
        CREATE INDEX IF NOT EXISTS idx_assets_cached_at ON assets(cached_at);

        CREATE TABLE IF NOT EXISTS audit_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id INTEGER NOT NULL,
            asset_tag TEXT NOT NULL,
            asset_name TEXT,
            location_id INTEGER,
            next_audit_date TEXT,
            note TEXT,
            created_at TEXT NOT NULL,
            attempts INTEGER DEFAULT 0,
            last_attempt_at TEXT,
            last_error TEXT,
            status TEXT NOT NULL DEFAULT 'pending'
        );

        CREATE TABLE IF NOT EXISTS cache_meta (
            key TEXT PRIMARY KEY,
            last_synced_at TEXT NOT NULL,
            total_items INTEGER,
            pages_cached INTEGER DEFAULT 0
        );
    `);
}

export async function closeDatabase() {
    if (db) {
        await db.closeAsync();
        db = null;
    }
}

export async function clearAllData() {
    const database = await getDatabase();
    await database.execAsync(`
        DELETE FROM assets;
        DELETE FROM audit_queue;
        DELETE FROM cache_meta;
    `);
}
