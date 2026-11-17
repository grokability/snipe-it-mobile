import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useThemeColors';
import { useFloatingHeaderOptions } from '@/components/ui/FloatingHeader';

const isIosBeforeLiquidGlass = Platform.OS === 'ios' && parseInt(Platform.Version, 10) < 26;

export function useStackHeaderOptions() {
    const colors = useColors();
    const floatingHeaderOptions = useFloatingHeaderOptions();

    return useMemo(() => ({
        headerShown: true,
        headerTransparent: true,
        headerBlurEffect: isIosBeforeLiquidGlass ? 'systemChromeMaterial' : undefined,
        headerShadowVisible: false,
        headerTitle: '',
        headerTintColor: colors.text,
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerRightContainerStyle: { paddingRight: 16 },
        scrollEdgeEffects: { top: 'soft' },
        ...floatingHeaderOptions,
    }), [colors, floatingHeaderOptions]);
}
