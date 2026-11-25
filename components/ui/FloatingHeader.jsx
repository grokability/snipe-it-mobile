import {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {FontWeight, Spacing, Typography} from '@/constants/sizes';

export const HEADER_BUTTON_SIZE = 40;

function FloatingBackButton() {
    const colors = useColors();

    return (
        <Pressable
            onPress={() => router.back()}
            hitSlop={4}
            accessibilityRole="button"
            style={[styles.backButton, {backgroundColor: colors.headerButtonBackground}]}
        >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
    );
}

function FloatingTitle({children}) {
    const colors = useColors();

    return (
        <View style={styles.titleRow}>
            <View style={[styles.titlePill, {backgroundColor: colors.headerButtonBackground}]}>
                <Text
                    numberOfLines={1}
                    accessibilityRole="header"
                    style={[styles.titleText, {color: colors.text}]}
                >
                    {children}
                </Text>
            </View>
        </View>
    );
}

export function floatingHeaderTitle(title) {
    return () => <FloatingTitle>{title}</FloatingTitle>;
}

export function useFloatingHeaderOptions() {
    return useMemo(() => ({
        headerStyle: {backgroundColor: 'transparent'},
        headerBackVisible: false,
        headerLeft: (props) => (props.canGoBack ? <FloatingBackButton /> : null),
    }), []);
}

export function useFloatingButtonGroupStyle() {
    const colors = useColors();

    return useMemo(() => ({
        backgroundColor: colors.headerButtonBackground,
        height: HEADER_BUTTON_SIZE,
        paddingVertical: 0,
        borderRadius: HEADER_BUTTON_SIZE / 2,
        overflow: 'hidden',
    }), [colors]);
}

export function StatusBarScrim() {
    const colors = useColors();
    const insets = useSafeAreaInsets();

    return (
        <View
            pointerEvents="none"
            style={[styles.scrim, {height: insets.top, backgroundColor: colors.statusBarScrim}]}
        />
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: HEADER_BUTTON_SIZE,
        height: HEADER_BUTTON_SIZE,
        borderRadius: HEADER_BUTTON_SIZE / 2,
        marginRight: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
    },
    titlePill: {
        flexShrink: 1,
        height: HEADER_BUTTON_SIZE,
        borderRadius: HEADER_BUTTON_SIZE / 2,
        paddingHorizontal: Spacing.lg,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    titleText: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.semibold,
    },
    scrim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
});
