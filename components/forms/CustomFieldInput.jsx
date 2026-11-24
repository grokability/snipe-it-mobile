import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {FormRow} from "@/components/forms/FormRow";
import {FormTextInput} from "@/components/forms/FormTextInput";
import OptionalDatepicker from "@/components/forms/OptionalDatepicker";
import Checkbox from "@/components/forms/Checkbox";
import {formatFieldValuesAsArray} from "@/helpers/customFields";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";

export const CustomFieldInput = ({fieldName, field, onChange}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const format = field.field_format;
    const element = field.element;
    const label = field.name || fieldName;

    if (element === 'checkbox') {
        if (field.field_values) {
            const options = formatFieldValuesAsArray(field.field_values);
            const selected = field.value ? field.value.split(',').map(value => value.trim()) : [];
            return (
                <FormRow label={label}>
                    <View style={{gap: Spacing.sm}}>
                        {options.map((option) => {
                            const isSelected = selected.includes(option.label);
                            return (
                                <Pressable
                                    key={option.label}
                                    onPress={() => {
                                        const newSelected = isSelected
                                            ? selected.filter(value => value !== option.label)
                                            : [...selected, option.label];
                                        onChange(newSelected.join(', '));
                                    }}
                                    style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs}}
                                >
                                    <Text style={{fontSize: Typography.bodyLarge, color: colors.text}}>{option.label}</Text>
                                    <Checkbox value={isSelected} onValueChange={() => {
                                        const newSelected = isSelected
                                            ? selected.filter(value => value !== option.label)
                                            : [...selected, option.label];
                                        onChange(newSelected.join(', '));
                                    }} />
                                </Pressable>
                            );
                        })}
                    </View>
                </FormRow>
            );
        }

        return (
            <FormRow label={label} horizontal>
                <Checkbox
                    value={field.value === '1'}
                    onValueChange={(isChecked) => onChange(isChecked ? '1' : '0')}
                />
            </FormRow>
        );
    }

    if (format === 'DATE' || format === 'date') {
        return (
            <FormRow label={label}>
                <OptionalDatepicker
                    initialDate={field.value ? new Date(field.value) : undefined}
                    onDateChange={(event, date) => {
                        if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            onChange(`${year}-${month}-${day}`);
                        } else {
                            onChange('');
                        }
                    }}
                />
            </FormRow>
        );
    }

    if ((element === 'radio') && field.field_values) {
        const options = formatFieldValuesAsArray(field.field_values);
        return (
            <FormRow label={label}>
                <View style={{gap: Spacing.sm}}>
                    {options.map((option) => (
                        <Pressable
                            key={option.label}
                            onPress={() => onChange(option.label)}
                            style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs}}
                        >
                            <Text style={{fontSize: Typography.bodyLarge, color: colors.text}}>{option.label}</Text>
                            <View style={{
                                width: 20, height: 20, borderRadius: 10,
                                borderWidth: 2,
                                borderColor: field.value === option.label ? colors.primary : colors.border,
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                {field.value === option.label && (
                                    <View style={{width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary}} />
                                )}
                            </View>
                        </Pressable>
                    ))}
                </View>
            </FormRow>
        );
    }

    if ((element === 'listbox' || format === 'listbox') && field.field_values) {
        const options = formatFieldValuesAsArray(field.field_values);
        return (
            <FormRow label={label}>
                <View style={styles.listboxContainer}>
                    {options.map((option) => (
                        <Pressable
                            key={option.value}
                            onPress={() => onChange(option.value)}
                            style={({pressed}) => [
                                styles.listboxOption,
                                field.value === option.value && styles.listboxOptionSelected,
                                pressed && styles.listboxOptionPressed,
                            ]}
                        >
                            <Text style={[
                                styles.listboxOptionText,
                                field.value === option.value && styles.listboxOptionTextSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </FormRow>
        );
    }

    return (
        <FormTextInput
            label={label}
            value={field.value}
            onChangeText={(text) => onChange(text)}
            multiline={format === 'textarea'}
        />
    );
};

const createStyles = (colors) => StyleSheet.create({
    listboxContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    listboxOption: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
    },
    listboxOptionPressed: {
        opacity: 0.7,
    },
    listboxOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    listboxOptionText: {
        fontSize: Typography.body,
        color: colors.text,
    },
    listboxOptionTextSelected: {
        color: '#fff',
        fontWeight: FontWeight.semibold,
    },
});
