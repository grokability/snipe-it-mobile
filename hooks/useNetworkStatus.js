import { useNetwork } from '@/context/NetworkProvider';

export function useNetworkStatus() {
    return useNetwork();
}
