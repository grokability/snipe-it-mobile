import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

export function useRefreshOnFocus(queryKey) {
    const queryClient = useQueryClient();
    const firstTimeRef = useRef(true);

    useFocusEffect(
        useCallback(() => {
            if (firstTimeRef.current) {
                firstTimeRef.current = false;
                return;
            }

            queryClient.refetchQueries({ queryKey, stale: true, type: 'active' }).catch(() => {});
        }, [queryClient, queryKey])
    );
}
