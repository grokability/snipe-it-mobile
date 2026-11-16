import { useMemo } from 'react';
import { useColors } from '@/hooks/useThemeColors';

export function useStackHeaderOptions() {
    const colors = useColors();

    return useMemo(() => ({
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTitle: '',
        headerTintColor: colors.text,
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerRightContainerStyle: { paddingRight: 16 },
        scrollEdgeEffects: { top: 'soft' },
    }), [colors]);
}
