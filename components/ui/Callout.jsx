import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, BorderRadius, Typography } from '@/constants/sizes';

const CALLOUT_ICONS = {
    warning: 'warning',
    info: 'information-circle',
};

// A tinted message box, after Snipe-IT's <x-callout>. type is 'warning' or 'info'. With onPress it
// becomes a button with a chevron.
export default function Callout({ type, onPress, children }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const typeColor = colors[type];
    const containerStyle = [styles.container, { backgroundColor: typeColor + '20', borderColor: typeColor }];

    const content = (
        <>
            <Ionicons name={CALLOUT_ICONS[type]} size={22} color={typeColor} />
            <Text style={styles.text}>{children}</Text>
            {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
        </>
    );

    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                onPress={onPress}
                style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
            >
                {content}
            </Pressable>
        );
    }

    return (
        <View accessibilityRole={type === 'warning' ? 'alert' : undefined} style={containerStyle}>
            {content}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
    },
    text: {
        flex: 1,
        fontSize: Typography.body,
        color: colors.text,
    },
    pressed: {
        opacity: 0.7,
    },
});
