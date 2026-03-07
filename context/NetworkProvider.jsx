import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Network from 'expo-network';

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
    const debounceTimer = useRef(null);

    useEffect(() => {
        const subscription = Network.addNetworkStateListener((state) => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);

            debounceTimer.current = setTimeout(() => {
                setIsConnected(state.isInternetReachable ?? state.isConnected ?? true);
            }, 3000);
        });

        // Get initial state immediately (no debounce)
        Network.getNetworkStateAsync().then((state) => {
            setIsConnected(state.isInternetReachable ?? state.isConnected ?? true);
        });

        return () => {
            subscription.remove();
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    return (
        <NetworkContext.Provider value={{ isConnected }}>
            {children}
        </NetworkContext.Provider>
    );
}
