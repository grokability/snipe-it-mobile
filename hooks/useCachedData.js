import { useState, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCachedAssets, cacheAssets, getCacheMeta } from '@/helpers/cacheManager';

export function useCachedData({ source, fetchFn }) {
    const { isConnected } = useNetworkStatus();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFromCache, setIsFromCache] = useState(false);
    const [cachedAt, setCachedAt] = useState(null);

    const loadData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        // If online (or forcing refresh), try fetching from API
        if (isConnected || forceRefresh) {
            try {
                const result = await fetchFn();
                setData(result);
                setIsFromCache(false);
                setCachedAt(null);

                // Cache in background
                if (result.length > 0) {
                    cacheAssets(result, source).catch(() => {});
                }
                setLoading(false);
                return;
            } catch (err) {
                // If online fetch fails, fall through to cache
                console.error('Fetch failed, trying cache:', err);
            }
        }

        // Offline or fetch failed — try cache
        try {
            const cached = await getCachedAssets(source);
            if (cached.length > 0) {
                setData(cached);
                setIsFromCache(true);
                const meta = await getCacheMeta(source);
                setCachedAt(meta?.last_synced_at || cached[0]?._cachedAt || null);
            } else {
                setData([]);
                setIsFromCache(false);
                if (!isConnected) {
                    setError('offline_no_cache');
                }
            }
        } catch (err) {
            console.error('Cache read failed:', err);
            setData([]);
        }

        setLoading(false);
    }, [isConnected, fetchFn, source]);

    const refresh = useCallback(() => {
        return loadData(true);
    }, [loadData]);

    return {
        data,
        setData,
        loading,
        error,
        isFromCache,
        cachedAt,
        loadData,
        refresh,
        isConnected,
    };
}
