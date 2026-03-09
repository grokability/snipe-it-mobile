import { getDatabase } from './database';
import { makeRequest } from '../axiosConfig';

const MAX_ATTEMPTS = 5;
const MAX_QUEUE_SIZE = 100;

export async function queueAudit({ asset_id, asset_tag, asset_name, location_id, next_audit_date, note }) {
    const db = await getDatabase();

    // Check queue size
    const countRow = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM audit_queue WHERE status IN ('pending', 'syncing')"
    );
    if (countRow.count >= MAX_QUEUE_SIZE) {
        throw new Error('queue_full');
    }

    // Check for duplicate pending audit for same asset
    const existing = await db.getFirstAsync(
        "SELECT id FROM audit_queue WHERE asset_id = ? AND status IN ('pending', 'syncing')",
        [asset_id]
    );
    if (existing) {
        throw new Error('duplicate_pending');
    }

    await db.runAsync(
        `INSERT INTO audit_queue (asset_id, asset_tag, asset_name, location_id, next_audit_date, note, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [asset_id, asset_tag, asset_name || null, location_id || null, next_audit_date || null, note || null, new Date().toISOString()]
    );
}

export async function getPendingAudits() {
    const db = await getDatabase();
    return db.getAllAsync(
        "SELECT * FROM audit_queue WHERE status IN ('pending', 'failed') ORDER BY created_at ASC"
    );
}

export async function getPendingCount() {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM audit_queue WHERE status IN ('pending', 'failed')"
    );
    return row?.count || 0;
}

export async function deleteQueueItem(id) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM audit_queue WHERE id = ?', [id]);
}

export async function processPendingAudits() {
    const db = await getDatabase();
    const pending = await db.getAllAsync(
        "SELECT * FROM audit_queue WHERE status = 'pending' ORDER BY created_at ASC"
    );

    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const item of pending) {
        try {
            await db.runAsync(
                "UPDATE audit_queue SET status = 'syncing', last_attempt_at = ? WHERE id = ?",
                [new Date().toISOString(), item.id]
            );

            const res = await makeRequest({
                url: '/hardware/audit',
                method: 'POST',
                data: {
                    asset_tag: item.asset_tag,
                    location_id: item.location_id || null,
                    next_audit_date: item.next_audit_date || null,
                    note: item.note || null,
                },
            });

            if (res.status === 'error') {
                throw new Error(typeof res.messages === 'string' ? res.messages : 'Server rejected audit');
            }

            await db.runAsync(
                "UPDATE audit_queue SET status = 'completed' WHERE id = ?",
                [item.id]
            );
            synced++;
        } catch (err) {
            const attempts = (item.attempts || 0) + 1;
            const isClientError = err?.response?.status >= 400 && err?.response?.status < 500;
            const newStatus = (attempts >= MAX_ATTEMPTS || isClientError) ? 'failed' : 'pending';

            await db.runAsync(
                "UPDATE audit_queue SET status = ?, attempts = ?, last_attempt_at = ?, last_error = ? WHERE id = ?",
                [newStatus, attempts, new Date().toISOString(), err.message || 'Unknown error', item.id]
            );
            failed++;

            // Stop processing on network errors (not client errors)
            if (!isClientError) break;
        }
    }

    // Clean up completed items older than 1 hour
    await db.runAsync(
        "DELETE FROM audit_queue WHERE status = 'completed' AND datetime(last_attempt_at) < datetime('now', '-1 hour')"
    );

    return { synced, failed };
}

export async function retryFailedAudit(id) {
    const db = await getDatabase();
    await db.runAsync(
        "UPDATE audit_queue SET status = 'pending', attempts = 0, last_error = NULL WHERE id = ?",
        [id]
    );
}
