import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useThemeColors';
import { useTranslation } from 'react-i18next';
import { Spacing, BorderRadius, Typography, FontWeight } from '@/constants/sizes';
import SelectStatusBottomSheet from '@/components/bottomSheets/SelectStatusBottomSheet';
import SelectCategoryBottomSheet from '@/components/bottomSheets/SelectCategoryBottomSheet';
import SelectManufacturerBottomSheet from '@/components/bottomSheets/SelectManufacturerBottomSheet';
import SelectSupplierBottomSheet from '@/components/bottomSheets/SelectSupplierBottomSheet';
import SelectLocationBottomSheet from '@/components/bottomSheets/SelectLocationBottomSheet';
import SelectCompanyBottomSheet from '@/components/bottomSheets/SelectCompanyBottomSheet';
import SelectModelBottomSheet from '@/components/bottomSheets/SelectModelBottomSheet';

const EMPTY_FILTERS = {
    status: null,
    category: null,
    manufacturer: null,
    supplier: null,
    location: null,
    company: null,
    model: null,
};

const AssetFilterBottomSheet = forwardRef(({ filters, onApply }, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const snapPoints = useMemo(() => ['60%', '90%'], []);

    const bottomSheetRef = useRef(null);
    useImperativeHandle(ref, () => ({
        present: () => bottomSheetRef.current?.present(),
        close: () => bottomSheetRef.current?.close(),
        dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
    // Keep a ref in sync so onDismiss always reads the latest value without stale closure issues
    const pendingFiltersRef = useRef(EMPTY_FILTERS);

    const updateFilter = (key, value) => {
        setTempFilters((prev) => {
            const next = { ...prev, [key]: value };
            pendingFiltersRef.current = next;
            return next;
        });
    };

    // Sync temp state from props when filters change (e.g. sheet re-opens with existing filters)
    useEffect(() => {
        const next = filters ?? EMPTY_FILTERS;
        setTempFilters(next);
        pendingFiltersRef.current = next;
    }, [filters]);

    const statusRef = useRef(null);
    const categoryRef = useRef(null);
    const manufacturerRef = useRef(null);
    const supplierRef = useRef(null);
    const locationRef = useRef(null);
    const companyRef = useRef(null);
    const modelRef = useRef(null);

    const filterRows = [
        { key: 'status', label: t('general.status_label'), sheetRef: statusRef },
        { key: 'category', label: t('general.category'), sheetRef: categoryRef },
        { key: 'manufacturer', label: t('general.manufacturer'), sheetRef: manufacturerRef },
        { key: 'supplier', label: t('general.supplier'), sheetRef: supplierRef },
        { key: 'location', label: t('general.location'), sheetRef: locationRef },
        { key: 'company', label: t('general.company'), sheetRef: companyRef },
        { key: 'model', label: t('general.model'), sheetRef: modelRef },
    ];

    const handleClearAll = () => {
        const empty = { ...EMPTY_FILTERS };
        setTempFilters(empty);
        pendingFiltersRef.current = empty;
        onApply(empty);
        bottomSheetRef.current?.close();
    };

    const handleApply = () => {
        onApply(pendingFiltersRef.current);
        bottomSheetRef.current?.close();
    };

    return (
        <>
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enableDynamicSizing={false}
                backgroundStyle={{ backgroundColor: colors.background }}
                handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
            >
                <GestureHandlerRootView style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('mobile.filter_assets')}</Text>
                        <Pressable onPress={handleClearAll} hitSlop={8}>
                            <Text style={styles.clearAllText}>{t('mobile.clear_all_filters')}</Text>
                        </Pressable>
                    </View>

                    {filterRows.map(({ key, label, sheetRef }) => (
                        <Pressable
                            key={key}
                            style={({ pressed }) => [styles.filterRow, pressed && styles.filterRowPressed]}
                            onPress={() => sheetRef.current?.present()}
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
                </GestureHandlerRootView>
            </BottomSheetModal>

            <SelectStatusBottomSheet
                ref={statusRef}
                title={t('general.status_label')}
                setSelectedStatus={(status) => updateFilter('status', { id: status.id, name: status.name })}
            />
            <SelectCategoryBottomSheet
                ref={categoryRef}
                title={t('general.category')}
                categoryType="asset"
                setSelectedCategory={(cat) => updateFilter('category', { id: cat.id, name: cat.name })}
            />
            <SelectManufacturerBottomSheet
                ref={manufacturerRef}
                title={t('general.manufacturer')}
                setSelectedManufacturer={(mfr) => updateFilter('manufacturer', { id: mfr.id, name: mfr.name })}
            />
            <SelectSupplierBottomSheet
                ref={supplierRef}
                title={t('general.supplier')}
                setSelectedSupplier={(sup) => updateFilter('supplier', { id: sup.id, name: sup.name })}
            />
            <SelectLocationBottomSheet
                ref={locationRef}
                title={t('general.location')}
                setSelectedLocation={(loc) => updateFilter('location', { id: loc.id, name: loc.name })}
            />
            <SelectCompanyBottomSheet
                ref={companyRef}
                title={t('general.company')}
                setSelectedCompany={(comp) => updateFilter('company', { id: comp.id, name: comp.name })}
            />
            <SelectModelBottomSheet
                ref={modelRef}
                title={t('general.model')}
                setSelectedModel={(model) => updateFilter('model', { id: model.id, name: model.name })}
            />
        </>
    );
});

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
