import React, {useEffect, useMemo} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
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

// Shared geometry for the entity detail screens: image, title block, then one
// SkeletonSection per Section the real screen renders.
function DetailScreenSkeleton({showQtyBadge = false, subtitleWidth = 100, subtitleHeight = 16, sections}) {
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
                    {showQtyBadge && <Skeleton width={60} height={20} borderRadius={BorderRadius.lg} />}
                    <Skeleton width={subtitleWidth} height={subtitleHeight} />
                </View>

                {sections.map((section, index) => (
                    <SkeletonSection key={index} titleWidth={section.titleWidth} rows={section.rows} />
                ))}
            </View>
        </SafeAreaProvider>
    );
}

// Shared geometry for the entity list screens: a column of cards, each an optional
// thumbnail beside a stack of text lines. `lines` describes one card's text widths.
function ListScreenSkeleton({rows = 6, showThumbnail = true, lines}) {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaProvider style={styles.listContainer}>
            <View style={{paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0}}>
                {Array.from({length: rows}).map((_, rowIndex) => (
                    <View key={rowIndex} style={styles.listCard}>
                        {showThumbnail && (
                            <Skeleton width="25%" height={100} borderRadius={BorderRadius.sm} />
                        )}
                        <View style={styles.listCardContent}>
                            {lines.map((line, lineIndex) => (
                                <Skeleton key={lineIndex} width={line.width} height={line.height} />
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        </SafeAreaProvider>
    );
}

export function AssetListSkeleton() {
    return (
        <ListScreenSkeleton
            lines={[
                {width: 70, height: 12},
                {width: '75%', height: 20},
                {width: '55%', height: 14},
                {width: 90, height: 14},
            ]}
        />
    );
}

export function AssetDetailSkeleton() {
    return (
        <DetailScreenSkeleton
            sections={[
                {titleWidth: 100, rows: 4},
                {titleWidth: 80, rows: 2},
                {titleWidth: 90, rows: 5},
            ]}
        />
    );
}

export function AccessoryDetailSkeleton() {
    return (
        <DetailScreenSkeleton
            showQtyBadge
            subtitleWidth={80}
            subtitleHeight={14}
            sections={[
                {titleWidth: 110, rows: 2},
                {titleWidth: 90, rows: 7},
                {titleWidth: 80, rows: 2},
            ]}
        />
    );
}

export function ConsumableDetailSkeleton() {
    return (
        <DetailScreenSkeleton
            showQtyBadge
            subtitleWidth={80}
            subtitleHeight={14}
            sections={[
                {titleWidth: 90, rows: 8},
                {titleWidth: 80, rows: 2},
                {titleWidth: 90, rows: 3},
            ]}
        />
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
    listContainer: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 5,
    },
    listCard: {
        width: '100%',
        padding: Spacing.lg,
        marginVertical: Spacing.sm,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    listCardContent: {
        flex: 1,
        gap: 6,
        justifyContent: 'center',
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
