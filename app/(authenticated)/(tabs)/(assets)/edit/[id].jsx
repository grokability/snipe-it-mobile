import React, {useCallback, useContext, useState, useMemo, useRef} from 'react';
import {decode} from "html-entities";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import * as Burnt from 'burnt';
import SelectStatusBottomSheet from "@/components/bottomSheets/SelectStatusBottomSheet";
import SelectModelBottomSheet from "@/components/bottomSheets/SelectModelBottomSheet";
import SelectCompanyBottomSheet from "@/components/bottomSheets/SelectCompanyBottomSheet";
import SelectSupplierBottomSheet from "@/components/bottomSheets/SelectSupplierBottomSheet";
import SelectLocationBottomSheet from "@/components/bottomSheets/SelectLocationBottomSheet";
import Datepicker from "@/components/Datepicker";
import Switch from "@/components/Switch";

// Parse "YYYY-MM-DD" as local date to avoid UTC timezone shift
// (dates without times were shifting before this)
function parseLocalDate(dateStr) {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
}

const SectionHeader = ({title, styles}) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const Section = ({title, children, styles}) => (
    <View>
        <SectionHeader title={title} styles={styles} />
        <View style={styles.detailsContainer}>
            {children}
        </View>
    </View>
);

const FormRow = ({label, children, styles, horizontal}) => (
    <View style={[styles.formRow, horizontal && styles.formRowHorizontal]}>
        <Text style={styles.formLabel}>{label}</Text>
        {children}
    </View>
);

const SelectorButton = ({label, value, onPress, styles, mutedColor, placeholder}) => (
    <FormRow label={label} styles={styles}>
        <Pressable
            onPress={onPress}
            style={({pressed}) => [
                styles.selectorButton,
                pressed && styles.selectorButtonPressed,
            ]}
        >
            <Text style={[styles.selectorButtonText, !value && {color: mutedColor}]}>
                {value || placeholder}
            </Text>
        </Pressable>
    </FormRow>
);

export default function EditAssetScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [asset, setAsset] = useState(null);
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    // Text fields
    const [name, setName] = useState('');
    const [assetTag, setAssetTag] = useState('');
    const [serial, setSerial] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [warrantyMonths, setWarrantyMonths] = useState('');
    const [notes, setNotes] = useState('');

    // Selectors
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedRtdLocation, setSelectedRtdLocation] = useState(null);

    // Dates
    const [purchaseDate, setPurchaseDate] = useState(null);
    const [nextAuditDate, setNextAuditDate] = useState(null);
    const [expectedCheckin, setExpectedCheckin] = useState(null);

    // Booleans
    const [requestable, setRequestable] = useState(false);
    const [byod, setByod] = useState(false);

    // Custom fields
    const [customFieldValues, setCustomFieldValues] = useState({});

    // Bottom sheet refs
    const statusRef = useRef(null);
    const modelRef = useRef(null);
    const companyRef = useRef(null);
    const supplierRef = useRef(null);
    const locationRef = useRef(null);
    const rtdLocationRef = useRef(null);

    const getAsset = useCallback(() => {
        setLoading(true);
        return makeRequest({
            url: `/hardware/${id}`,
            method: 'get'
        })
            .then(res => {
                setAsset(res);
                populateFields(res);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    const populateFields = (a) => {
        setName(a.name ? decode(a.name) : '');
        setAssetTag(a.asset_tag ? decode(a.asset_tag) : '');
        setSerial(a.serial ? decode(a.serial) : '');
        setOrderNumber(a.order_number ? decode(a.order_number) : '');
        setPurchaseCost(a.purchase_cost || '');
        setWarrantyMonths(a.warranty_months ? String(a.warranty_months) : '');
        setNotes(a.notes ? decode(a.notes) : '');

        if (a.status_label) {
            setSelectedStatus({ id: a.status_label.id, name: decode(a.status_label.name), value: a.status_label.id });
        }
        if (a.model) {
            setSelectedModel({ id: a.model.id, name: decode(a.model.name) });
        }
        if (a.company) {
            setSelectedCompany({ id: a.company.id, name: decode(a.company.name) });
        }
        if (a.supplier) {
            setSelectedSupplier({ id: a.supplier.id, name: decode(a.supplier.name) });
        }
        if (a.location) {
            setSelectedLocation({ id: a.location.id, name: decode(a.location.name) });
        }
        if (a.rtd_location) {
            setSelectedRtdLocation({ id: a.rtd_location.id, name: decode(a.rtd_location.name) });
        }

        if (a.purchase_date?.date) {
            setPurchaseDate(parseLocalDate(a.purchase_date.date));
        }
        if (a.next_audit_date?.date) {
            setNextAuditDate(parseLocalDate(a.next_audit_date.date));
        }
        if (a.expected_checkin?.date) {
            setExpectedCheckin(parseLocalDate(a.expected_checkin.date));
        }

        setRequestable(!!a.requestable);
        setByod(!!a.byod);

        // Custom fields
        if (a.custom_fields) {
            const cfValues = {};
            Object.entries(a.custom_fields).forEach(([key, field]) => {
                cfValues[field.field] = {
                    value: field.value ? decode(field.value) : '',
                    field_format: field.field_format,
                    field_values: field.field_values,
                    db_column: field.db_column,
                };
            });
            setCustomFieldValues(cfValues);
        }
    };

    useFocusEffect(
        useCallback(() => {
            getAsset();
        }, [getAsset])
    );

    const formatDateForApi = (date) => {
        if (!date) return undefined;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleSubmit = () => {
        if (!assetTag.trim()) {
            Burnt.alert({
                title: t('general.error'),
                preset: "error",
                message: t('mobile.asset_tag_required'),
                duration: 2,
            });
            return;
        }

        setSubmitting(true);

        const data = {
            name: name || null,
            asset_tag: assetTag,
            serial: serial || null,
            order_number: orderNumber || null,
            purchase_cost: purchaseCost || null,
            warranty_months: warrantyMonths ? parseInt(warrantyMonths, 10) : null,
            notes: notes || null,
            status_id: selectedStatus?.id || selectedStatus?.value,
            model_id: selectedModel?.id,
            company_id: selectedCompany?.id || null,
            supplier_id: selectedSupplier?.id || null,
            location_id: selectedLocation?.id || null,
            rtd_location_id: selectedRtdLocation?.id || null,
            purchase_date: formatDateForApi(purchaseDate),
            next_audit_date: formatDateForApi(nextAuditDate),
            expected_checkin: formatDateForApi(expectedCheckin),
            requestable: requestable,
            byod: byod ? 1 : 0,
        };

        // Custom fields
        Object.values(customFieldValues).forEach((cf) => {
            if (cf.db_column) {
                data[cf.db_column] = cf.value;
            }
        });

        makeRequest({
            url: `/hardware/${id}`,
            method: 'PUT',
            data,
        })
            .then(res => {
                if (res.status === 'error') {
                    Burnt.alert({
                        title: t('general.error'),
                        preset: "error",
                        message: res.messages ? Object.values(res.messages).flat().join('\n') : t('mobile.edit_failed'),
                        duration: 4,
                    });
                    return;
                }
                Burnt.alert({
                    title: t('general.notification_success'),
                    preset: "heart",
                    message: t('mobile.edit_success'),
                    duration: 2,
                });
                router.replace(`/(tabs)/(assets)/${id}`);
            })
            .catch(err => {
                console.error(err);
                Burnt.alert({
                    title: t('general.error'),
                    preset: "error",
                    message: t('mobile.edit_failed'),
                    duration: 4,
                });
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    const selectPlaceholder = t('general.select');

    const updateCustomField = (fieldName, newValue) => {
        setCustomFieldValues(prev => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], value: newValue },
        }));
    };

    const renderCustomField = (fieldName, field) => {
        const format = field.field_format;

        if (format === 'checkbox' || format === 'boolean') {
            return (
                <FormRow key={fieldName} label={fieldName} styles={styles}>
                    <Pressable
                        onPress={() => updateCustomField(fieldName, field.value === '1' ? '0' : '1')}
                        style={styles.toggleRow}
                    >
                        <Text style={styles.toggleText}>
                            {field.value === '1' ? t('mobile.yes') : t('mobile.no')}
                        </Text>
                    </Pressable>
                </FormRow>
            );
        }

        if (format === 'date') {
            return (
                <FormRow key={fieldName} label={fieldName} styles={styles}>
                    <Datepicker
                        initialDate={field.value ? new Date(field.value) : undefined}
                        onDateChange={(event, date) => {
                            if (date) {
                                const y = date.getFullYear();
                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                const d = String(date.getDate()).padStart(2, '0');
                                updateCustomField(fieldName, `${y}-${m}-${d}`);
                            }
                        }}
                    />
                </FormRow>
            );
        }

        if ((format === 'listbox' || format === 'radio') && field.field_values) {
            const options = typeof field.field_values === 'string'
                ? field.field_values.split('\n').map(v => v.trim()).filter(Boolean)
                : Array.isArray(field.field_values) ? field.field_values : [];
            return (
                <FormRow key={fieldName} label={fieldName} styles={styles}>
                    <View style={styles.listboxContainer}>
                        {options.map((opt) => (
                            <Pressable
                                key={opt}
                                onPress={() => updateCustomField(fieldName, opt)}
                                style={({pressed}) => [
                                    styles.listboxOption,
                                    field.value === opt && styles.listboxOptionSelected,
                                    pressed && styles.selectorButtonPressed,
                                ]}
                            >
                                <Text style={[
                                    styles.listboxOptionText,
                                    field.value === opt && styles.listboxOptionTextSelected,
                                ]}>
                                    {opt}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </FormRow>
            );
        }

        // Default: text / textarea
        return (
            <FormRow key={fieldName} label={fieldName} styles={styles}>
                <TextInput
                    style={[styles.input, format === 'textarea' && styles.textareaInput]}
                    value={field.value}
                    onChangeText={(text) => updateCustomField(fieldName, text)}
                    multiline={format === 'textarea'}
                    numberOfLines={format === 'textarea' ? 4 : 1}
                    placeholderTextColor={colors.textMuted}
                />
            </FormRow>
        );
    };

    if (loading || !asset) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary}/>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top}]}
                keyboardShouldPersistTaps="handled"
            >
                {/* General Info */}
                <Section styles={styles} title={t('mobile.section_details')}>
                    <FormRow styles={styles} label={t('general.asset_name')}>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('general.asset_name')}
                            placeholderTextColor={colors.textMuted}
                        />
                    </FormRow>
                    <FormRow styles={styles} label={t('general.asset_tag')}>
                        <TextInput
                            style={styles.input}
                            value={assetTag}
                            onChangeText={setAssetTag}
                            placeholder={t('general.asset_tag')}
                            placeholderTextColor={colors.textMuted}
                        />
                    </FormRow>
                    <FormRow styles={styles} label={t('general.serial')}>
                        <TextInput
                            style={styles.input}
                            value={serial}
                            onChangeText={setSerial}
                            placeholder={t('general.serial')}
                            placeholderTextColor={colors.textMuted}
                        />
                    </FormRow>

                    <SelectorButton
                        styles={styles}
                        mutedColor={colors.textMuted}
                        placeholder={selectPlaceholder}
                        label={t('general.status_label')}
                        value={selectedStatus?.name}
                        onPress={() => statusRef.current?.present()}
                    />
                    <SelectorButton
                        styles={styles}
                        mutedColor={colors.textMuted}
                        placeholder={selectPlaceholder}
                        label={t('general.model')}
                        value={selectedModel?.name}
                        onPress={() => modelRef.current?.present()}
                    />
                    <SelectorButton
                        styles={styles}
                        mutedColor={colors.textMuted}
                        placeholder={selectPlaceholder}
                        label={t('general.company')}
                        value={selectedCompany?.name}
                        onPress={() => companyRef.current?.present()}
                    />
                </Section>

                {/* Location */}
                <Section styles={styles} title={t('mobile.section_location')}>
                    <SelectorButton
                        styles={styles}
                        mutedColor={colors.textMuted}
                        placeholder={selectPlaceholder}
                        label={t('general.location')}
                        value={selectedLocation?.name}
                        onPress={() => locationRef.current?.present()}
                    />
                    <SelectorButton
                        styles={styles}
                        mutedColor={colors.textMuted}
                        placeholder={selectPlaceholder}
                        label={t('general.rtd_location')}
                        value={selectedRtdLocation?.name}
                        onPress={() => rtdLocationRef.current?.present()}
                    />
                </Section>

                {/* Purchase Info */}
                <Section styles={styles} title={t('mobile.section_purchase')}>
                    <FormRow styles={styles} label={t('general.purchase_date')}>
                        <Datepicker
                            initialDate={purchaseDate}
                            onDateChange={(event, date) => date && setPurchaseDate(date)}
                        />
                    </FormRow>
                    <FormRow styles={styles} label={t('general.purchase_cost')}>
                        <TextInput
                            style={styles.input}
                            value={purchaseCost}
                            onChangeText={setPurchaseCost}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            placeholderTextColor={colors.textMuted}
                        />
                    </FormRow>
                    <FormRow styles={styles} label={t('general.order_number')}>
                        <TextInput
                            style={styles.input}
                            value={orderNumber}
                            onChangeText={setOrderNumber}
                            placeholder={t('general.order_number')}
                            placeholderTextColor={colors.textMuted}
                        />
                    </FormRow>
                    <SelectorButton
                        styles={styles}
                        mutedColor={colors.textMuted}
                        placeholder={selectPlaceholder}
                        label={t('general.supplier')}
                        value={selectedSupplier?.name}
                        onPress={() => supplierRef.current?.present()}
                    />
                    <FormRow styles={styles} label={t('general.warranty_months')}>
                        <TextInput
                            style={styles.input}
                            value={warrantyMonths}
                            onChangeText={setWarrantyMonths}
                            placeholder="0"
                            keyboardType="number-pad"
                            placeholderTextColor={colors.textMuted}
                        />
                    </FormRow>
                </Section>

                {/* Dates */}
                <Section styles={styles} title={t('mobile.section_dates')}>
                    <FormRow styles={styles} label={t('general.next_audit_date')}>
                        <Datepicker
                            initialDate={nextAuditDate}
                            onDateChange={(event, date) => date && setNextAuditDate(date)}
                        />
                    </FormRow>
                    <FormRow styles={styles} label={t('general.expected_checkin')}>
                        <Datepicker
                            initialDate={expectedCheckin}
                            onDateChange={(event, date) => date && setExpectedCheckin(date)}
                        />
                    </FormRow>
                </Section>

                {/* Toggles */}
                <Section styles={styles} title={t('mobile.section_details')}>
                    <FormRow styles={styles} label={t('general.requestable')} horizontal>
                        <Switch value={requestable} onValueChange={setRequestable} />
                    </FormRow>
                    <FormRow styles={styles} label={t('general.byod')} horizontal>
                        <Switch value={byod} onValueChange={setByod} />
                    </FormRow>
                </Section>

                {/* Custom Fields */}
                {Object.keys(customFieldValues).length > 0 && (
                    <Section styles={styles} title={t('mobile.section_custom_fields')}>
                        {Object.entries(customFieldValues).map(([fieldName, field]) =>
                            renderCustomField(fieldName, field)
                        )}
                    </Section>
                )}

                {/* Notes */}
                <Section styles={styles} title={t('mobile.section_notes')}>
                    <TextInput
                        style={[styles.input, styles.textareaInput]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={t('general.notes')}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor={colors.textMuted}
                    />
                </Section>

                {/* Submit */}
                <Pressable
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={({pressed}) => [
                        styles.submitButton,
                        pressed && styles.submitButtonPressed,
                        submitting && styles.submitButtonDisabled,
                    ]}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>{t('mobile.save_changes')}</Text>
                    )}
                </Pressable>
            </ScrollView>

            {/* Bottom Sheets */}
            <SelectStatusBottomSheet
                title={t('general.select_statuslabel')}
                ref={statusRef}
                setSelectedStatus={setSelectedStatus}
            />
            <SelectModelBottomSheet
                title={t('mobile.select_model')}
                ref={modelRef}
                setSelectedModel={setSelectedModel}
            />
            <SelectCompanyBottomSheet
                title={t('mobile.select_company')}
                ref={companyRef}
                setSelectedCompany={setSelectedCompany}
            />
            <SelectSupplierBottomSheet
                title={t('mobile.select_supplier')}
                ref={supplierRef}
                setSelectedSupplier={setSelectedSupplier}
            />
            <SelectLocationBottomSheet
                title={t('general.select_location')}
                ref={locationRef}
                setSelectedLocation={setSelectedLocation}
            />
            <SelectLocationBottomSheet
                title={t('general.rtd_location')}
                ref={rtdLocationRef}
                setSelectedLocation={setSelectedRtdLocation}
            />
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: Spacing.lg,
        paddingBottom: 100,
        gap: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: colors.text,
        marginBottom: Spacing.sm,
    },
    detailsContainer: {
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.lg,
    },
    formRow: {
        gap: Spacing.xs,
    },
    formRowHorizontal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    formLabel: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
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
    selectorButton: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        backgroundColor: colors.backgroundTertiary,
    },
    selectorButtonPressed: {
        opacity: 0.7,
    },
    selectorButtonText: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
    },
    toggleRow: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        backgroundColor: colors.backgroundTertiary,
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleText: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
        fontWeight: FontWeight.medium,
    },
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
    submitButton: {
        backgroundColor: colors.primary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    submitButtonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}],
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
    },
});
