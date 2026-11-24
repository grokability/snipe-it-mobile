import React, {useContext, useEffect, useState, useMemo, useRef} from 'react';
import {decode} from "html-entities";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
} from 'react-native';
import {KeyboardAvoidingForm} from "@/components/ui/KeyboardAvoidingForm";
import {LoadingScreen} from "@/components/ui/LoadingScreen";
import {router, useLocalSearchParams} from "expo-router";
import {useItemRoutePrefix} from "@/hooks/useItemRoutePrefix";
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {makeRequest} from "@/helpers/axiosConfig";
import {PermissionDeniedError} from "@/helpers/errors";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {assetKeys, customFieldKeys} from "@/helpers/queryKeys";
import {PermissionGate} from '@/permissions/PermissionGate';
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
import Datepicker from "@/components/forms/Datepicker";
import OptionalDatepicker from "@/components/forms/OptionalDatepicker";
import Switch from "@/components/forms/Switch";
import {Section} from "@/components/ui/Section";
import {FormRow} from "@/components/forms/FormRow";
import {FormTextInput} from "@/components/forms/FormTextInput";
import {SelectorButton} from "@/components/forms/SelectorButton";
import ImagePicker from "@/components/forms/ImagePicker";
import {CustomFieldInput} from "@/components/forms/CustomFieldInput";

// Parse "YYYY-MM-DD" as local date to avoid UTC timezone shift
// (dates without times were shifting before this)
function parseLocalDate(dateStr) {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
}

export default function EditAssetScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const itemRoutePrefix = useItemRoutePrefix();

    const { id } = useLocalSearchParams();
    const queryClient = useQueryClient();

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

    const assetQuery = useQuery({
        queryKey: assetKeys.detail(id),
        queryFn: () => makeRequest({ url: `/hardware/${id}`, method: 'get', permissionKey: PERMISSIONS.ASSETS_VIEW }),
    });

    const fieldsQuery = useQuery({
        queryKey: customFieldKeys.all,
        queryFn: () => makeRequest({ url: '/fields', method: 'get', permissionKey: PERMISSIONS.CUSTOMFIELDS_VIEW }),
        refetchOnMount: 'always',
    });

    const populatedForIdRef = useRef(null);

    const populateFields = (asset, fieldDefs = {}, fieldDefsByName = {}) => {
        setName(asset.name ? decode(asset.name) : '');
        setAssetTag(asset.asset_tag ? decode(asset.asset_tag) : '');
        setSerial(asset.serial ? decode(asset.serial) : '');
        setOrderNumber(asset.order_number ? decode(asset.order_number) : '');
        setPurchaseCost(asset.purchase_cost || '');
        setWarrantyMonths(asset.warranty_months ? String(asset.warranty_months) : '');
        setNotes(asset.notes ? decode(asset.notes) : '');

        if (asset.status_label) {
            setSelectedStatus({ id: asset.status_label.id, name: decode(asset.status_label.name), value: asset.status_label.id });
        }
        if (asset.model) {
            setSelectedModel({ id: asset.model.id, name: decode(asset.model.name) });
        }
        if (asset.company) {
            setSelectedCompany({ id: asset.company.id, name: decode(asset.company.name) });
        }
        if (asset.supplier) {
            setSelectedSupplier({ id: asset.supplier.id, name: decode(asset.supplier.name) });
        }
        if (asset.rtd_location) {
            setSelectedRtdLocation({ id: asset.rtd_location.id, name: decode(asset.rtd_location.name) });
        }

        if (asset.purchase_date?.date) {
            setPurchaseDate(parseLocalDate(asset.purchase_date.date));
        }
        if (asset.next_audit_date?.date) {
            setNextAuditDate(parseLocalDate(asset.next_audit_date.date));
        }
        if (asset.expected_checkin?.date) {
            setExpectedCheckin(parseLocalDate(asset.expected_checkin.date));
        }

        setRequestable(!!asset.requestable);
        setByod(!!asset.byod);

        // Custom fields
        if (asset.custom_fields) {
            const initialCustomFieldValues = {};
            Object.entries(asset.custom_fields).forEach(([key, field]) => {
                const options = (field.field in fieldDefs ? fieldDefs[field.field] : fieldDefsByName[key]) || null;
                initialCustomFieldValues[key] = {
                    value: field.value ? decode(field.value) : '',
                    field_format: field.field_format,
                    element: field.element,
                    field_values: options,
                    db_column: field.field,
                    name: key,
                };
            });
            setCustomFieldValues(initialCustomFieldValues);
        }
    };

    useEffect(() => {
        if (!assetQuery.data || !fieldsQuery.isFetchedAfterMount) return;
        if (populatedForIdRef.current === id) return;
        populatedForIdRef.current = id;

        const fieldDefs = {};
        const fieldDefsByName = {};
        if (fieldsQuery.data?.rows) {
            fieldsQuery.data.rows.forEach(fieldDefinition => {
                fieldDefs[fieldDefinition.db_column_name] = fieldDefinition.field_values_array;
                fieldDefsByName[decode(fieldDefinition.name)] = fieldDefinition.field_values_array;
            });
        }
        populateFields(assetQuery.data, fieldDefs, fieldDefsByName);
    }, [assetQuery.data, fieldsQuery.data, fieldsQuery.isFetchedAfterMount, id]);

    const formatDateForApi = (date) => {
        if (!date) return undefined;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const editMutation = useMutation({
        mutationFn: (data) => makeRequest({
            url: `/hardware/${id}`,
            method: 'PUT',
            data,
            permissionKey: PERMISSIONS.ASSETS_EDIT,
        }),
        onSuccess: (response) => {
            if (response.status === 'error') {
                Burnt.alert({
                    title: t('general.error'),
                    preset: "error",
                    message: response.messages ? Object.values(response.messages).flat().join('\n') : t('mobile.edit_failed'),
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
            queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) }).catch(() => {});
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() }).catch(() => {});
            router.dismissTo(`${itemRoutePrefix}/assets/${id}`);
        },
        onError: (error) => {
            if (error instanceof PermissionDeniedError) return;
            console.error(error);
            Burnt.alert({
                title: t('general.error'),
                preset: "error",
                message: t('mobile.edit_failed'),
                duration: 4,
            });
        },
    });

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

        const data = {
            name: name || null,
            asset_tag: assetTag,
            serial: serial || null,
            order_number: orderNumber || null,
            purchase_cost: purchaseCost.replace(/,/g, '') || null,
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

        if (image?.dataUri) {
            data.image = image.dataUri;
        }

        // Custom fields
        Object.values(customFieldValues).forEach((customField) => {
            if (customField.db_column) {
                data[customField.db_column] = customField.value;
            }
        });

        editMutation.mutate(data);
    };

    const selectPlaceholder = t('general.select');

    const updateCustomField = (fieldName, newValue) => {
        setCustomFieldValues(prev => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], value: newValue },
        }));
    };

    if (!assetQuery.data || !fieldsQuery.isFetchedAfterMount) {
        return (
            <LoadingScreen />
        );
    }

    return (
        <SafeAreaProvider>
            <KeyboardAvoidingForm>
            <ScrollView
                automaticallyAdjustKeyboardInsets
                style={styles.container}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.contentContainer, {paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0}]}
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

                    {/* Core Details — matches web UI top section */}
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
                            value={selectedModel?.name}
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

                    {/* Custom Fields */}
                    {Object.keys(customFieldValues).length > 0 && (
                        <Section title={t('mobile.section_custom_fields')}>
                            {Object.entries(customFieldValues).map(([fieldName, field]) =>
                                <CustomFieldInput key={fieldName} fieldName={fieldName} field={field}
                                    onChange={(newValue) => updateCustomField(fieldName, newValue)} />
                            )}
                        </Section>
                    )}

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

                    {/* Submit */}
                    <PermissionGate permission={PERMISSIONS.ASSETS_EDIT}>
                        <Pressable
                            onPress={handleSubmit}
                            disabled={editMutation.isPending}
                            style={({pressed}) => [
                                styles.submitButton,
                                pressed && styles.submitButtonPressed,
                                editMutation.isPending && styles.submitButtonDisabled,
                            ]}
                        >
                            {editMutation.isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>{t('mobile.save_changes')}</Text>
                            )}
                        </Pressable>
                    </PermissionGate>
            </ScrollView>
            </KeyboardAvoidingForm>

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
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: Spacing.lg,
        paddingBottom: 100,
        gap: Spacing.xxl,
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
