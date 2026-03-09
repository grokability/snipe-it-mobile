import {getDatabase} from './database';

export async function getSessionItems() {
    const db = await getDatabase();
    return db.getAllAsync(
        'SELECT * FROM audit_session_items ORDER BY timestamp DESC'
    );
}

export async function insertSessionItem({asset_id, asset_tag, name, model, timestamp, session_start}) {
    const db = await getDatabase();
    await db.runAsync(
        `INSERT INTO audit_session_items (asset_id, asset_tag, name, model, timestamp, session_start)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [asset_id, asset_tag, name, model, timestamp, session_start]
    );
}

export async function clearSessionItems() {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM audit_session_items');
}
