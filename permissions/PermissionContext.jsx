import React, { createContext, useContext, useState, useEffect } from 'react';
import { PermissionManager } from './PermissionManager';

const PermissionContext = createContext(0);

export const PermissionProvider = ({ children }) => {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        return PermissionManager.subscribe(() => setVersion(v => v + 1));
    }, []);

    return (
        <PermissionContext.Provider value={version}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermission = (key) => {
    useContext(PermissionContext); // re-renders this hook whenever PermissionManager notifies
    return {
        permissionState: PermissionManager.get(key),
        allowed: PermissionManager.isAllowed(key),
        denied:  PermissionManager.isKnownDenied(key),
    };
};
