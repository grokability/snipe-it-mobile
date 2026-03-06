import React, {createContext, useCallback, useContext, useState} from 'react';

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

    const addAuditedAsset = useCallback((asset) => {
        if (!sessionStartTime) {
            setSessionStartTime(new Date());
        }
        setAuditedAssets((prev) => [
            {
                id: asset.id,
                asset_tag: asset.asset_tag,
                name: asset.name,
                model: asset.model?.name || null,
                timestamp: new Date().toISOString(),
            },
            ...prev,
        ]);
    }, [sessionStartTime]);

    const clearSession = useCallback(() => {
        setAuditedAssets([]);
        setSessionStartTime(null);
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
