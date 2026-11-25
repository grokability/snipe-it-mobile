import React, {useRef} from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {FormRow} from "@/components/forms/FormRow";
import {FormTextInput} from "@/components/forms/FormTextInput";
import {SelectorButton} from "@/components/forms/SelectorButton";
import SelectOptionBottomSheet from "@/components/bottomSheets/SelectOptionBottomSheet";
import OptionalDatepicker from "@/components/forms/OptionalDatepicker";
import Checkbox from "@/components/forms/Checkbox";
import {formatFieldValuesAsArray} from "@/helpers/customFields";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, Typography} from "@/constants/sizes";

export const CustomFieldInput = ({fieldName, field, onChange}) => {
    const colors = useColors();
    const {t} = useTranslation();
    const optionSheetRef = useRef(null);

    const format = field.field_format;
    const element = field.element;
    const label = field.name || fieldName;

    if (field.db_column_warning) {
        return (
            <FormRow label={label}>
                <Text style={{fontSize: Typography.body, color: colors.textSecondary}}>
                    {t('mobile.custom_field_column_mismatch')}
                </Text>
            </FormRow>
        );
    }

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
        const selectedOption = options.find((option) => option.value === field.value);

        return (
            <>
                <SelectorButton
                    label={label}
                    value={selectedOption?.label ?? field.value}
                    placeholder={t('general.select')}
                    onPress={() => optionSheetRef.current?.present()}
                />
                <SelectOptionBottomSheet
                    ref={optionSheetRef}
                    title={label}
                    options={options}
                    selectedValue={field.value}
                    onSelect={(value) => onChange(value)}
                />
            </>
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

