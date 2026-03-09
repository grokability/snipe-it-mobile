import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { processPendingAudits } from '@/helpers/db/syncManager';

const NetworkContext = createContext();

export function useNetwork() {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
}

export function NetworkProvider({ children }) {
    const [isConnected, setIsConnected] = useState(true);
    const [lastSyncResult, setLastSyncResult] = useState(null);
    const debounceTimer = useRef(null);
    const syncingRef = useRef(false);
    const wasOfflineRef = useRef(false);

    const trySync = useCallback(async () => {
        if (syncingRef.current) return;
        syncingRef.current = true;
        try {
            const result = await processPendingAudits();
            if (result.synced > 0 || result.failed > 0) {
                setLastSyncResult(result);
            }
        } catch (err) {
            console.error('Sync failed:', err);
        } finally {
            syncingRef.current = false;
        }
    }, []);

    useEffect(() => {
        const subscription = Network.addNetworkStateListener((state) => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);

            debounceTimer.current = setTimeout(() => {
                const connected = state.isInternetReachable ?? state.isConnected ?? true;
                setIsConnected(connected);

                // Sync when coming back online
                if (connected && wasOfflineRef.current) {
                    trySync();
                }
                wasOfflineRef.current = !connected;
            }, 3000);
        });

        // Get initial state immediately (no debounce)
        Network.getNetworkStateAsync().then((state) => {
            const connected = state.isInternetReachable ?? state.isConnected ?? true;
            setIsConnected(connected);
            wasOfflineRef.current = !connected;
        });

        return () => {
            subscription.remove();
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [trySync]);

    // Sync on app foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active' && isConnected) {
                trySync();
            }
        });
        return () => subscription.remove();
    }, [isConnected, trySync]);

    return (
        <NetworkContext.Provider value={{ isConnected, lastSyncResult, clearSyncResult: () => setLastSyncResult(null), trySync }}>
            {children}
        </NetworkContext.Provider>
    );
}
