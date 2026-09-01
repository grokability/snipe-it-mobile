import React, {useEffect, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withRepeat, withTiming} from 'react-native-reanimated';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius} from '@/constants/sizes';

export function Skeleton({width = '100%', height = 16, borderRadius = BorderRadius.sm, style}) {
    const colors = useColors();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, {duration: 800}), -1, true);
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({opacity: opacity.value}));

    return (
        <Animated.View
            style={[{width, height, borderRadius, backgroundColor: colors.backgroundTertiary}, animatedStyle, style]}
        />
    );
}

function SkeletonSection({titleWidth = 120, rows}) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View>
            <Skeleton width={titleWidth} height={18} style={styles.sectionTitle} />
            <View style={styles.detailsContainer}>
                {Array.from({length: rows}).map((_, index) => (
                    <View key={index} style={styles.detailRow}>
                        <Skeleton width={90} height={16} />
                        <Skeleton width={70} height={16} />
                    </View>
                ))}
            </View>
        </View>
    );
}

export function AssetDetailSkeleton() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaProvider>
            <View style={[styles.container, {paddingTop: insets.top + 44}]}>
                <View style={styles.imageContainer}>
                    <Skeleton width={250} height={250} borderRadius={BorderRadius.md} />
                </View>

                <View style={styles.headerContainer}>
                    <Skeleton width={180} height={24} />
                    <Skeleton width={100} height={16} />
                </View>

                <SkeletonSection titleWidth={100} rows={4} />
                <SkeletonSection titleWidth={80} rows={2} />
                <SkeletonSection titleWidth={90} rows={5} />
            </View>
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: Spacing.lg,
        gap: Spacing.xxl,
    },
    imageContainer: {
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
    },
    headerContainer: {
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sectionTitle: {
        marginBottom: Spacing.sm,
    },
    detailsContainer: {
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
