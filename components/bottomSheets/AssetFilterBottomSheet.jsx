import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Button, Platform, StyleSheet } from 'react-native';
import { BottomSheetModal } from '@expo/ui/community/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useThemeColors';
import { useTranslation } from 'react-i18next';
import { Spacing, BorderRadius, Typography, FontWeight } from '@/constants/sizes';
import { useAssetFilterBottomSheet } from '@/components/bottomSheets/useAssetFilterBottomSheet';
import { useSelectListBottomSheet } from '@/components/bottomSheets/useSelectListBottomSheet';
import SelectListContent from '@/components/bottomSheets/SelectListContent';

const SNAP_POINTS = ['60%', '90%'];

// A second native modal can't be stacked on top of this one (iOS/Android only allow one
// presented sheet at a time), so drill-down pickers render as swapped-in content inside this
// same sheet instead of presenting their own SelectListBottomSheet.
const FILTER_FIELDS = [
    { key: 'status', endpoint: '/statuslabels/selectlist' },
    { key: 'category', endpoint: '/categories/asset/selectlist' },
    { key: 'manufacturer', endpoint: '/manufacturers/selectlist' },
    { key: 'supplier', endpoint: '/suppliers/selectlist' },
    { key: 'location', endpoint: '/locations/selectlist' },
    { key: 'company', endpoint: '/companies/selectlist' },
    { key: 'model', endpoint: '/models/selectlist' },
];

const FieldPicker = ({ field, label, selectedValue, onSelect, onBack }) => {
    const { t } = useTranslation();
    const selectListProps = useSelectListBottomSheet({
        endpoint: field.endpoint,
        selectedValue,
        onSelect,
        onSelected: onBack,
    });
    const { fetchInitial } = selectListProps;

    useEffect(() => {
        fetchInitial();
    }, []);

    return (
        <SelectListContent
            {...selectListProps}
            title={label}
            selectedValue={selectedValue}
            headerAction={<Button title={t('general.back')} onPress={onBack} />}
        />
    );
};

const AssetFilterBottomSheet = forwardRef(({ filters, onApply }, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const bottomSheetRef = useRef(null);
    useImperativeHandle(ref, () => ({
        present: () => bottomSheetRef.current?.present(),
        close: () => bottomSheetRef.current?.close(),
        dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const { tempFilters, updateFilter, handleClearAll, handleApply } = useAssetFilterBottomSheet({
        filters,
        onApply,
        bottomSheetRef,
    });

    const [activeField, setActiveField] = useState(null);
    const returnToMenu = () => setActiveField(null);

    const filterRows = FILTER_FIELDS.map((field) => ({
        ...field,
        label: t(field.key === 'status' ? 'general.status_label' : `general.${field.key}`),
    }));

    const activeFieldConfig = filterRows.find((row) => row.key === activeField);

    const backgroundStyle = Platform.OS === 'ios' ? undefined : { backgroundColor: colors.background };

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={SNAP_POINTS}
            enablePanDownToClose
            backgroundStyle={backgroundStyle}
            onDismiss={returnToMenu}
        >
            {activeFieldConfig ? (
                <FieldPicker
                    field={activeFieldConfig}
                    label={activeFieldConfig.label}
                    selectedValue={tempFilters[activeFieldConfig.key]}
                    onSelect={(item) => updateFilter(activeFieldConfig.key, { id: item.id, name: item.name })}
                    onBack={returnToMenu}
                />
            ) : (
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('mobile.filter_assets')}</Text>
                        <Pressable onPress={handleClearAll} hitSlop={8}>
                            <Text style={styles.clearAllText}>{t('mobile.clear_all_filters')}</Text>
                        </Pressable>
                    </View>

                    {filterRows.map(({ key, label }) => (
                        <Pressable
                            key={key}
                            style={({ pressed }) => [styles.filterRow, pressed && styles.filterRowPressed]}
                            onPress={() => setActiveField(key)}
                        >
                            <Text style={styles.filterLabel}>{label}</Text>
                            <View style={styles.filterValueContainer}>
                                <Text
                                    style={[
                                        styles.filterValue,
                                        tempFilters[key] != null && styles.filterValueActive,
                                    ]}
                                >
                                    {tempFilters[key]?.name ?? t('mobile.filter_any')}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                            </View>
                        </Pressable>
                    ))}

                    <Pressable
                        style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
                        onPress={handleApply}
                    >
                        <Text style={styles.applyButtonText}>{t('mobile.apply_filters')}</Text>
                    </Pressable>
                </View>
            )}
        </BottomSheetModal>
    );
});

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        // Left transparent on iOS so the sheet's Liquid Glass material shows through.
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background,
        paddingHorizontal: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    clearAllText: {
        fontSize: Typography.body,
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    filterRowPressed: {
        backgroundColor: colors.backgroundTertiary,
    },
    filterLabel: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
        fontWeight: FontWeight.medium,
    },
    filterValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    filterValue: {
        fontSize: Typography.body,
        color: colors.textMuted,
    },
    filterValueActive: {
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
    applyButton: {
        marginTop: Spacing.lg,
        backgroundColor: colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    applyButtonPressed: {
        opacity: 0.8,
    },
    applyButtonText: {
        color: '#ffffff',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
    },
});

export default AssetFilterBottomSheet;
