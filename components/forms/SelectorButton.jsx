import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FormRow} from "@/components/forms/FormRow";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography} from "@/constants/sizes";

export const SelectorButton = ({label, value, onPress, placeholder}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <FormRow label={label}>
            <Pressable
                onPress={onPress}
                style={({pressed}) => [
                    styles.selectorButton,
                    pressed && styles.selectorButtonPressed,
                ]}
            >
                <Text style={[styles.selectorButtonText, !value && {color: colors.textMuted}]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
        </FormRow>
    );
};

const createStyles = (colors) => StyleSheet.create({
    selectorButton: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        backgroundColor: colors.backgroundTertiary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorButtonPressed: {
        opacity: 0.7,
    },
    selectorButtonText: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
    },
});
