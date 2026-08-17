import React, {useContext, useState, useEffect, useMemo, useRef} from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {router} from "expo-router";
import {makeRequest} from "@/helpers/axiosConfig";
import {PermissionDeniedError} from "@/helpers/errors";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {PermissionGate} from '@/permissions/PermissionGate';
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import * as Burnt from 'burnt';
import {decode} from 'html-entities';
import SelectStatusBottomSheet from "@/components/bottomSheets/SelectStatusBottomSheet";
import SelectModelBottomSheet from "@/components/bottomSheets/SelectModelBottomSheet";
import SelectCompanyBottomSheet from "@/components/bottomSheets/SelectCompanyBottomSheet";
import SelectSupplierBottomSheet from "@/components/bottomSheets/SelectSupplierBottomSheet";
import SelectLocationBottomSheet from "@/components/bottomSheets/SelectLocationBottomSheet";
import Datepicker from "@/components/forms/Datepicker";
import OptionalDatepicker from "@/components/forms/OptionalDatepicker";
import Switch from "@/components/forms/Switch";
import Checkbox from "@/components/forms/Checkbox";
import {Section} from "@/components/ui/Section";
import {FormRow} from "@/components/forms/FormRow";
import {FormTextInput} from "@/components/forms/FormTextInput";
import {SelectorButton} from "@/components/forms/SelectorButton";
import ImagePicker from "@/components/forms/ImagePicker";

export default function CreateAssetScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [loadingFields, setLoadingFields] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useContext(AuthContext);

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
    const [selectedRtdLocation, setSelectedRtdLocation] = useState(null);

    // Dates
    const [purchaseDate, setPurchaseDate] = useState(null);
    const [nextAuditDate, setNextAuditDate] = useState(null);
    const [expectedCheckin, setExpectedCheckin] = useState(null);

    // Booleans
    const [requestable, setRequestable] = useState(false);
    const [byod, setByod] = useState(false);

    // Image
    const [image, setImage] = useState(null);

    // Custom fields
    const [customFieldValues, setCustomFieldValues] = useState({});

    // Bottom sheet refs
    const statusRef = useRef(null);
    const modelRef = useRef(null);
    const companyRef = useRef(null);
    const supplierRef = useRef(null);
    const rtdLocationRef = useRef(null);

    useEffect(() => {
        if (!selectedModel) {
            setCustomFieldValues({});
            return;
        }

        const fieldsetId = selectedModel.fieldset?.id;
        if (!fieldsetId) {
            setCustomFieldValues({});
            return;
        }

        setLoadingFields(true);
        console.log(`Fetching custom fields for fieldset ID: ${fieldsetId}`);
        makeRequest({ url: `/fieldsets/${fieldsetId}/fields`, method: 'POST', permissionKey: PERMISSIONS.CUSTOMFIELDS_VIEW })
            .then((response) => {
                const rows = response?.rows;
                if (rows) {
                    const mapped = {};
                    rows.forEach(field => {
                        const key = field.name;
                        mapped[key] = {
                            value: '',
                            field_format: field.format,
                            element: field.element,
                            field_values: field.field_values_array || null,
                            db_column: field.db_column_name,
                            name: key,
                        };
                    });
                    setCustomFieldValues(mapped);
                } else {
                    setCustomFieldValues({});
                }
            })
            .catch(error => {
                console.error(error);
                setCustomFieldValues({});
            })
            .finally(() => {
                setLoadingFields(false);
            });
    }, [selectedModel]);

    const formatDateForApi = (date) => {
        if (!date) return undefined;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = () => {
        if (!selectedStatus) {
            Burnt.alert({
                title: t('general.error'),
                preset: "error",
                message: t('mobile.status_required'),
                duration: 2,
            });
            return;
        }

        if (!selectedModel) {
            Burnt.alert({
                title: t('general.error'),
                preset: "error",
                message: t('mobile.model_required'),
                duration: 2,
            });
            return;
        }

        setSubmitting(true);

        const fields = {
            name: name || null,
            asset_tag: assetTag || null,
            serial: serial || null,
            order_number: orderNumber || null,
            purchase_cost: purchaseCost || null,
            warranty_months: warrantyMonths ? parseInt(warrantyMonths, 10) : null,
            notes: notes || null,
            status_id: selectedStatus?.id || selectedStatus?.value,
            model_id: selectedModel?.id,
            company_id: selectedCompany?.id || null,
            supplier_id: selectedSupplier?.id || null,
            rtd_location_id: selectedRtdLocation?.id || null,
            purchase_date: formatDateForApi(purchaseDate),
            next_audit_date: formatDateForApi(nextAuditDate),
            expected_checkin: formatDateForApi(expectedCheckin),
            requestable: requestable,
            byod: byod ? 1 : 0,
        };

        // Custom fields
        Object.values(customFieldValues).forEach((customField) => {
            if (customField.db_column) {
                fields[customField.db_column] = customField.value;
            }
        });

        if (image?.dataUri) {
            fields.image = image.dataUri;
        }

        makeRequest({
            url: '/hardware',
            method: 'POST',
            data: fields,
            permissionKey: PERMISSIONS.ASSETS_CREATE,
        })
            .then(response => {
                if (response.status === 'error') {
                    Burnt.alert({
                        title: t('general.error'),
                        preset: "error",
                        message: response.messages ? Object.values(response.messages).flat().join('\n') : t('mobile.create_failed'),
                        duration: 4,
                    });
                    return;
                }
                Burnt.alert({
                    title: t('general.notification_success'),
                    preset: "heart",
                    message: t('mobile.create_success'),
                    duration: 2,
                });
                router.replace(`/(tabs)/(assets)/${response.payload.id}`);
            })
            .catch(error => {
                if (error instanceof PermissionDeniedError) return;
                console.error(error);
                Burnt.alert({
                    title: t('general.error'),
                    preset: "error",
                    message: t('mobile.create_failed'),
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
        const element = field.element;
        const label = field.name || fieldName;

        if (element === 'checkbox') {
            if (field.field_values) {
                const options = typeof field.field_values === 'string'
                    ? field.field_values.split('\n').map(value => value.trim()).filter(Boolean)
                    : Array.isArray(field.field_values) ? field.field_values : [];
                const selected = field.value ? field.value.split(',').map(value => value.trim()) : [];
                return (
                    <FormRow key={fieldName} label={label}>
                        <View style={{gap: Spacing.sm}}>
                            {options.map((option) => {
                                const isSelected = selected.includes(option);
                                return (
                                    <Pressable
                                        key={option}
                                        onPress={() => {
                                            const newSelected = isSelected
                                                ? selected.filter(value => value !== option)
                                                : [...selected, option];
                                            updateCustomField(fieldName, newSelected.join(', '));
                                        }}
                                        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs}}
                                    >
                                        <Text style={{fontSize: Typography.bodyLarge, color: colors.text}}>{option}</Text>
                                        <Checkbox value={isSelected} onValueChange={() => {
                                            const newSelected = isSelected
                                                ? selected.filter(value => value !== option)
                                                : [...selected, option];
                                            updateCustomField(fieldName, newSelected.join(', '));
                                        }} />
                                    </Pressable>
                                );
                            })}
                        </View>
                    </FormRow>
                );
            }
            return (
                <FormRow key={fieldName} label={label} horizontal>
                    <Checkbox
                        value={field.value === '1'}
                        onValueChange={(isChecked) => updateCustomField(fieldName, isChecked ? '1' : '0')}
                    />
                </FormRow>
            );
        }

        if (format === 'DATE' || format === 'date') {
            return (
                <FormRow key={fieldName} label={label}>
                    <OptionalDatepicker
                        initialDate={field.value ? new Date(field.value) : undefined}
                        onDateChange={(event, date) => {
                            if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                updateCustomField(fieldName, `${year}-${month}-${day}`);
                            } else {
                                updateCustomField(fieldName, '');
                            }
                        }}
                    />
                </FormRow>
            );
        }

        if ((element === 'radio') && field.field_values) {
            const options = typeof field.field_values === 'string'
                ? field.field_values.split('\n').map(value => value.trim()).filter(Boolean)
                : Array.isArray(field.field_values) ? field.field_values : [];
            return (
                <FormRow key={fieldName} label={label}>
                    <View style={{gap: Spacing.sm}}>
                        {options.map((option) => (
                            <Pressable
                                key={option}
                                onPress={() => updateCustomField(fieldName, option)}
                                style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs}}
                            >
                                <Text style={{fontSize: Typography.bodyLarge, color: colors.text}}>{option}</Text>
                                <View style={{
                                    width: 20, height: 20, borderRadius: 10,
                                    borderWidth: 2,
                                    borderColor: field.value === option ? colors.primary : colors.border,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {field.value === option && (
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
            const options = typeof field.field_values === 'string'
                ? field.field_values.split('\n').map(value => value.trim()).filter(Boolean)
                : Array.isArray(field.field_values) ? field.field_values : [];
            return (
                <FormRow key={fieldName} label={label}>
                    <View style={styles.listboxContainer}>
                        {options.map((option) => (
                            <Pressable
                                key={option}
                                onPress={() => updateCustomField(fieldName, option)}
                                style={({pressed}) => [
                                    styles.listboxOption,
                                    field.value === option && styles.listboxOptionSelected,
                                    pressed && styles.selectorButtonPressed,
                                ]}
                            >
                                <Text style={[
                                    styles.listboxOptionText,
                                    field.value === option && styles.listboxOptionTextSelected,
                                ]}>
                                    {option}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </FormRow>
            );
        }

        // Default: text / textarea
        return (
            <FormTextInput
                key={fieldName}
                label={label}
                value={field.value}
                onChangeText={(text) => updateCustomField(fieldName, text)}
                multiline={format === 'textarea'}
            />
        );
    };

    return (
        <SafeAreaProvider>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* Image Upload */}
                <Section title={t('general.image')}>
                    <ImagePicker
                        image={image}
                        onImageSelected={setImage}
                        onImageRemoved={() => setImage(null)}
                    />
                </Section>

                {/* Required / Core Info — matches web UI top section */}
                <Section title={t('mobile.section_details')}>
                    <SelectorButton
                        placeholder={selectPlaceholder}
                        label={t('general.company')}
                        value={selectedCompany?.name}
                        onPress={() => companyRef.current?.present()}
                    />
                    <FormTextInput
                        label={t('general.asset_tag')}
                        value={assetTag}
                        onChangeText={setAssetTag}
                        placeholder={t('general.asset_tag')}
                        helperText={t('mobile.asset_tag_hint')}
                    />
                    <FormTextInput
                        label={t('general.serial')}
                        value={serial}
                        onChangeText={setSerial}
                        placeholder={t('general.serial')}
                    />
                    <SelectorButton
                        placeholder={selectPlaceholder}
                        label={t('general.model')}
                        value={selectedModel?.name ? decode(selectedModel.name) : undefined}
                        onPress={() => modelRef.current?.present()}
                    />
                    <SelectorButton
                        placeholder={selectPlaceholder}
                        label={t('general.status_label')}
                        value={selectedStatus?.name}
                        onPress={() => statusRef.current?.present()}
                    />
                    <FormTextInput
                        label={t('general.notes')}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={t('general.notes')}
                        multiline
                    />
                    <SelectorButton
                        placeholder={selectPlaceholder}
                        label={t('general.rtd_location')}
                        value={selectedRtdLocation?.name}
                        onPress={() => rtdLocationRef.current?.present()}
                    />
                    <FormRow label={t('general.requestable')} horizontal>
                        <Switch value={requestable} onValueChange={setRequestable} />
                    </FormRow>
                </Section>

                {/* Optional Information — collapsible */}
                <Section title={t('mobile.section_optional')} collapsible>
                    <FormTextInput
                        label={t('general.asset_name')}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('general.asset_name')}
                    />
                    <FormTextInput
                        label={t('general.warranty_months')}
                        value={warrantyMonths}
                        onChangeText={setWarrantyMonths}
                        placeholder="0"
                        keyboardType="number-pad"
                    />
                    <FormRow label={t('general.expected_checkin')}>
                        <OptionalDatepicker
                            initialDate={expectedCheckin}
                            onDateChange={(event, date) => setExpectedCheckin(date)}
                        />
                    </FormRow>
                    <FormRow label={t('general.next_audit_date')}>
                        <OptionalDatepicker
                            initialDate={nextAuditDate}
                            onDateChange={(event, date) => setNextAuditDate(date)}
                        />
                    </FormRow>
                    <FormRow label={t('general.byod')} horizontal>
                        <Switch value={byod} onValueChange={setByod} />
                    </FormRow>
                </Section>

                {/* Order Related Information — collapsible */}
                <Section title={t('mobile.section_order')} collapsible>
                    <FormTextInput
                        label={t('general.order_number')}
                        value={orderNumber}
                        onChangeText={setOrderNumber}
                        placeholder={t('general.order_number')}
                    />
                    <FormRow label={t('general.purchase_date')}>
                        <OptionalDatepicker
                            initialDate={purchaseDate}
                            onDateChange={(event, date) => setPurchaseDate(date)}
                        />
                    </FormRow>
                    <SelectorButton
                        placeholder={selectPlaceholder}
                        label={t('general.supplier')}
                        value={selectedSupplier?.name}
                        onPress={() => supplierRef.current?.present()}
                    />
                    <FormTextInput
                        label={t('general.purchase_cost')}
                        value={purchaseCost}
                        onChangeText={setPurchaseCost}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                    />
                </Section>

                {/* Custom Fields */}
                {loadingFields && (
                    <Section title={t('mobile.section_custom_fields')}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </Section>
                )}
                {!loadingFields && Object.keys(customFieldValues).length > 0 && (
                    <Section title={t('mobile.section_custom_fields')}>
                        {Object.entries(customFieldValues).map(([fieldName, field]) =>
                            renderCustomField(fieldName, field)
                        )}
                    </Section>
                )}

                {/* Submit */}
                <PermissionGate permission={PERMISSIONS.ASSETS_CREATE}>
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
                            <Text style={styles.submitButtonText}>{t('mobile.create_asset')}</Text>
                        )}
                    </Pressable>
                </PermissionGate>
            </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Sheets */}
            <SelectStatusBottomSheet
                title={t('general.select_statuslabel')}
                ref={statusRef}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
            />
            <SelectModelBottomSheet
                title={t('mobile.select_model')}
                ref={modelRef}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
            />
            <SelectCompanyBottomSheet
                title={t('mobile.select_company')}
                ref={companyRef}
                selectedCompany={selectedCompany}
                setSelectedCompany={setSelectedCompany}
            />
            <SelectSupplierBottomSheet
                title={t('mobile.select_supplier')}
                ref={supplierRef}
                selectedSupplier={selectedSupplier}
                setSelectedSupplier={setSelectedSupplier}
            />
            <SelectLocationBottomSheet
                title={t('general.rtd_location')}
                ref={rtdLocationRef}
                selectedLocation={selectedRtdLocation}
                setSelectedLocation={setSelectedRtdLocation}
            />
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    flex: {
        flex: 1,
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
    selectorButtonPressed: {
        opacity: 0.7,
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
