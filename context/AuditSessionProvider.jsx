import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {getSessionItems, insertSessionItem, clearSessionItems} from '@/helpers/db/auditSessionDb';

const AuditSessionContext = createContext();

export function useAuditSession() {
    const context = useContext(AuditSessionContext);
    if (!context) {
        throw new Error('useAuditSession must be used within an AuditSessionProvider');
    }
    return context;
}

export function AuditSessionProvider({children}) {
    const [auditedAssets, setAuditedAssets] = useState([]);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        getSessionItems().then((rows) => {
            if (rows.length > 0) {
                setAuditedAssets(rows);
                setSessionStartTime(new Date(rows[rows.length - 1].session_start));
            }
            setLoaded(true);
        }).catch(() => setLoaded(true));
    }, []);

    const addAuditedAsset = useCallback(async (asset) => {
        const now = new Date();
        const startTime = sessionStartTime || now;

        if (!sessionStartTime) {
            setSessionStartTime(now);
        }

        const item = {
            asset_id: asset.id,
            asset_tag: asset.asset_tag,
            name: asset.name,
            model: asset.model?.name || null,
            timestamp: now.toISOString(),
            session_start: startTime.toISOString(),
        };

        setAuditedAssets((prev) => [item, ...prev]);
        await insertSessionItem(item);
    }, [sessionStartTime]);

    const clearSession = useCallback(async () => {
        setAuditedAssets([]);
        setSessionStartTime(null);
        await clearSessionItems();
    }, []);

    const sessionCount = auditedAssets.length;
    const isActive = sessionCount > 0;

    return (
        <AuditSessionContext.Provider
            value={{
                auditedAssets,
                sessionStartTime,
                sessionCount,
                isActive,
                addAuditedAsset,
                clearSession,
            }}
        >
            {children}
        </AuditSessionContext.Provider>
    );
}
