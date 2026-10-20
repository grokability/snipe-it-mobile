import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, BorderRadius, Typography } from '@/constants/sizes';

const CALLOUT_ICONS = {
    warning: 'warning',
    info: 'information-circle',
};

// A tinted message box, after Snipe-IT's <x-callout>. type is 'warning' or 'info'.
export default function Callout({ type, children }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const typeColor = colors[type];

    return (
        <View
            accessibilityRole={type === 'warning' ? 'alert' : undefined}
            style={[styles.container, { backgroundColor: typeColor + '20', borderColor: typeColor }]}
        >
            <Ionicons name={CALLOUT_ICONS[type]} size={22} color={typeColor} />
            <Text style={styles.text}>{children}</Text>
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
});
