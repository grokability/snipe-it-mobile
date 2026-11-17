import {useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing} from '@/constants/sizes';

const BUTTON_SIZE = 40;

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
        height: BUTTON_SIZE,
        paddingVertical: 0,
        borderRadius: BUTTON_SIZE / 2,
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
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        marginRight: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrim: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
});
