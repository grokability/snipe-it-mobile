import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

export function useRefreshOnFocus(queryKey) {
    const queryClient = useQueryClient();
    const firstTimeRef = useRef(true);

    // Callers build the key inline, so it's a new array every render. Reading it from a ref keeps the focus
    // callback stable; with the key as a dependency, useFocusEffect re-ran it on every render, and a query that
    // had failed (no data, so stale) refetched in a loop.
    const queryKeyRef = useRef(queryKey);
    useEffect(() => {
        queryKeyRef.current = queryKey;
    });

    useFocusEffect(
        useCallback(() => {
            if (firstTimeRef.current) {
                firstTimeRef.current = false;
                return;
            }

            queryClient.refetchQueries({ queryKey: queryKeyRef.current, stale: true, type: 'active' }).catch(() => {});
        }, [queryClient])
    );
}
