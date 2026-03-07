import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, Typography, FontWeight } from '@/constants/sizes';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
    const { isConnected } = useNetworkStatus();
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const height = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (!isConnected) {
            height.value = withTiming(40, { duration: 300 });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            height.value = withTiming(0, { duration: 300 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [isConnected]);

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.banner, animatedStyle]}>
            <Text style={styles.bannerText} numberOfLines={1}>
                {t('mobile.offline_banner')}
            </Text>
        </Animated.View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    banner: {
        backgroundColor: colors.warning,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bannerText: {
        color: '#1a1a1a',
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
        paddingHorizontal: Spacing.lg,
    },
});
