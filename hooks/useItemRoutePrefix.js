import {useSegments} from 'expo-router';

// Item screens also render inside the scanner sheet's own stack (iOS). Links between them
// must stay in the stack they were opened in, so they're built on this prefix.
export function useItemRoutePrefix() {
    const segments = useSegments();

    return segments[0] === 'scanner' ? '/scanner' : '';
}
