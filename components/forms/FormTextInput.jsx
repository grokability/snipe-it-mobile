import React, {useMemo} from 'react';
import {StyleSheet, TextInput} from 'react-native';
import {FormRow} from "@/components/forms/FormRow";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography} from "@/constants/sizes";

export const FormTextInput = ({label, value, onChangeText, placeholder, keyboardType, multiline}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const input = (
        <TextInput
            style={[styles.input, multiline && styles.textareaInput]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
        />
    );
    if (!label) return input;
    return <FormRow label={label}>{input}</FormRow>;
};

const createStyles = (colors) => StyleSheet.create({
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        fontSize: Typography.bodyLarge,
        color: colors.text,
        backgroundColor: colors.backgroundTertiary,
    },
    textareaInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
});
