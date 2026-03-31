import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FormRow} from "@/components/forms/FormRow";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

export const SelectorButton = ({label, value, onPress, placeholder}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const a11yLabel = value
        ? t('a11y.selector_button', {label, value})
        : t('a11y.selector_button_empty', {label});
    return (
        <FormRow label={label}>
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
                style={({pressed}) => [
                    styles.selectorButton,
                    pressed && styles.selectorButtonPressed,
                ]}
            >
                <Text style={[styles.selectorButtonText, !value && {color: colors.textMuted}]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} importantForAccessibility="no" accessibilityElementsHidden={true} />
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
