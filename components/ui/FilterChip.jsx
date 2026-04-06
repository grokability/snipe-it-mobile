import React, { useMemo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useThemeColors';
import { BorderRadius, Spacing, Typography, FontWeight } from '@/constants/sizes';

export default function FilterChip({ label, onRemove, style }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={[styles.chip, style]}>
            <Text style={styles.label}>{label}</Text>
            {onRemove && (
                <Pressable onPress={onRemove} hitSlop={8}>
                    <Ionicons name="close-circle" size={14} color={colors.primary} />
                </Pressable>
            )}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '22',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        gap: Spacing.xs,
    },
    label: {
        fontSize: Typography.caption,
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
});
