import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useThemeColors';

const isIosBeforeLiquidGlass = Platform.OS === 'ios' && parseInt(Platform.Version, 10) < 26;

export function useStackHeaderOptions() {
    const colors = useColors();

    return useMemo(() => ({
        headerShown: true,
        headerTransparent: Platform.OS === 'ios',
        headerStyle: Platform.OS === 'android' ? { backgroundColor: colors.background } : undefined,
        headerBlurEffect: isIosBeforeLiquidGlass ? 'systemChromeMaterial' : undefined,
        headerShadowVisible: false,
        headerTitle: '',
        headerTintColor: colors.text,
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerRightContainerStyle: { paddingRight: 16 },
        scrollEdgeEffects: { top: 'soft' },
    }), [colors]);
}
