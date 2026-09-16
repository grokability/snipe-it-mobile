import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 150_000,
            retry: (failureCount, error) => {
                if (error?.status >= 400 && error?.status < 500) {
                    return false;
                }
                return failureCount < 2;
            },
        },
    },
});
