import React, {useCallback, useState, useMemo, useRef} from 'react';
import {decode} from 'html-entities';
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
import {router, useFocusEffect, useLocalSearchParams} from 'expo-router';
import {makeRequest} from '@/helpers/axiosConfig';
import {PERMISSIONS} from '@/permissions/PermissionKeys';
import {usePermission} from '@/permissions/PermissionContext';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import * as Burnt from 'burnt';
import SelectCategoryBottomSheet from '@/components/bottomSheets/SelectCategoryBottomSheet';
import SelectManufacturerBottomSheet from '@/components/bottomSheets/SelectManufacturerBottomSheet';
import SelectSupplierBottomSheet from '@/components/bottomSheets/SelectSupplierBottomSheet';
import SelectCompanyBottomSheet from '@/components/bottomSheets/SelectCompanyBottomSheet';
import SelectLocationBottomSheet from '@/components/bottomSheets/SelectLocationBottomSheet';
import Datepicker from '@/components/forms/Datepicker';
import Switch from '@/components/forms/Switch';
import {Section} from '@/components/ui/Section';
import {FormRow} from '@/components/forms/FormRow';
import {FormTextInput} from '@/components/forms/FormTextInput';
import {SelectorButton} from '@/components/forms/SelectorButton';

function parseLocalDate(dateStr) {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
}

export default function EditConsumableScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    const { denied: editDenied } = usePermission(PERMISSIONS.CONSUMABLES_EDIT);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const {id} = useLocalSearchParams();

    // Text fields
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');
    const [itemNo, setItemNo] = useState('');
    const [modelNumber, setModelNumber] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [minAmt, setMinAmt] = useState('');
    const [notes, setNotes] = useState('');

    // Selectors
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedManufacturer, setSelectedManufacturer] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Dates
    const [purchaseDate, setPurchaseDate] = useState(null);

    // Booleans
    const [requestable, setRequestable] = useState(false);

    // Bottom sheet refs
    const categoryRef = useRef(null);
    const manufacturerRef = useRef(null);
    const supplierRef = useRef(null);
    const companyRef = useRef(null);
    const locationRef = useRef(null);

    const getConsumable = useCallback(() => {
        setLoading(true);
        return makeRequest({url: `/consumables/${id}`, method: 'get', permissionKey: PERMISSIONS.CONSUMABLES_VIEW})
            .then(populateFields)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const populateFields = (consumable) => {
        setName(consumable.name ? decode(consumable.name) : '');
        setQty(consumable.qty != null ? String(consumable.qty) : '');
        setItemNo(consumable.item_no ? decode(consumable.item_no) : '');
        setModelNumber(consumable.model_number ? decode(consumable.model_number) : '');
        setOrderNumber(consumable.order_number ? decode(consumable.order_number) : '');
        setPurchaseCost(consumable.purchase_cost || '');
        setMinAmt(consumable.min_amt != null ? String(consumable.min_amt) : '');
        setNotes(consumable.notes ? decode(consumable.notes) : '');

        if (consumable.category) setSelectedCategory({id: consumable.category.id, name: decode(consumable.category.name)});
        if (consumable.manufacturer) setSelectedManufacturer({id: consumable.manufacturer.id, name: decode(consumable.manufacturer.name)});
        if (consumable.supplier) setSelectedSupplier({id: consumable.supplier.id, name: decode(consumable.supplier.name)});
        if (consumable.company) setSelectedCompany({id: consumable.company.id, name: decode(consumable.company.name)});
        if (consumable.location) setSelectedLocation({id: consumable.location.id, name: decode(consumable.location.name)});
        if (consumable.purchase_date?.date) setPurchaseDate(parseLocalDate(consumable.purchase_date.date));
        setRequestable(!!consumable.requestable);
    };

    useFocusEffect(useCallback(() => {
        getConsumable();
    }, [getConsumable]));

    const formatDateForApi = (date) => {
        if (!date) return undefined;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.consumable_name_required'),
                duration: 2,
            });
            return;
        }
        if (!qty.trim()) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.consumable_qty_required'),
                duration: 2,
            });
            return;
        }

        setSubmitting(true);

        makeRequest({
            url: `/consumables/${id}`,
            method: 'PUT',
            permissionKey: PERMISSIONS.CONSUMABLES_EDIT,
            data: {
                name,
                qty: parseInt(qty, 10),
                item_no: itemNo || null,
                category_id: selectedCategory?.id || null,
                manufacturer_id: selectedManufacturer?.id || null,
                supplier_id: selectedSupplier?.id || null,
                company_id: selectedCompany?.id || null,
                location_id: selectedLocation?.id || null,
                model_number: modelNumber || null,
                order_number: orderNumber || null,
                purchase_cost: purchaseCost || null,
                purchase_date: formatDateForApi(purchaseDate),
                min_amt: minAmt ? parseInt(minAmt, 10) : null,
                requestable: requestable ? 1 : 0,
                notes: notes || null,
            },
        })
            .then((res) => {
                if (res.status === 'error') {
                    const errMsg = typeof res.messages === 'string'
                        ? res.messages
                        : res.messages
                            ? Object.values(res.messages).flat().join('\n')
                            : t('mobile.edit_consumable_failed');
                    Burnt.alert({
                        title: t('general.error'),
                        preset: 'error',
                        message: errMsg,
                        duration: 4,
                    });
                    return;
                }
                Burnt.alert({
                    title: t('general.notification_success'),
                    preset: 'heart',
                    message: t('mobile.edit_consumable_success'),
                    duration: 2,
                });
                router.replace(`/(tabs)/(consumables)/${id}`);
            })
            .catch((err) => {
                console.error(err);
                Burnt.alert({
                    title: t('general.error'),
                    preset: 'error',
                    message: t('mobile.edit_consumable_failed'),
                    duration: 4,
                });
            })
            .finally(() => setSubmitting(false));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top}]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Details */}
                <Section title={t('mobile.section_details')}>
                    <FormTextInput
                        label={t('general.name')}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('general.name')}
                    />
                    <SelectorButton
                        label={t('general.category')}
                        value={selectedCategory?.name}
                        placeholder={t('general.select')}
                        onPress={() => categoryRef.current?.present()}
                    />
                    <FormTextInput
                        label={t('general.qty')}
                        value={qty}
                        onChangeText={setQty}
                        placeholder="0"
                        keyboardType="number-pad"
                    />
                    <SelectorButton
                        label={t('general.manufacturer')}
                        value={selectedManufacturer?.name}
                        placeholder={t('general.select')}
                        onPress={() => manufacturerRef.current?.present()}
                    />
                    <FormTextInput
                        label={t('mobile.item_number')}
                        value={itemNo}
                        onChangeText={setItemNo}
                        placeholder={t('mobile.item_number')}
                    />
                    <FormTextInput
                        label={t('general.model_number')}
                        value={modelNumber}
                        onChangeText={setModelNumber}
                        placeholder={t('general.model_number')}
                    />
                    <FormTextInput
                        label={t('mobile.min_qty_alert')}
                        value={minAmt}
                        onChangeText={setMinAmt}
                        placeholder="0"
                        keyboardType="number-pad"
                    />
                    <FormRow label={t('general.requestable')} horizontal>
                        <Switch value={requestable} onValueChange={setRequestable} />
                    </FormRow>
                </Section>

                {/* Location */}
                <Section title={t('mobile.section_location')}>
                    <SelectorButton
                        label={t('general.location')}
                        value={selectedLocation?.name}
                        placeholder={t('general.select')}
                        onPress={() => locationRef.current?.present()}
                    />
                    <SelectorButton
                        label={t('general.company')}
                        value={selectedCompany?.name}
                        placeholder={t('general.select')}
                        onPress={() => companyRef.current?.present()}
                    />
                </Section>

                {/* Purchase */}
                <Section title={t('mobile.section_purchase')}>
                    <FormRow label={t('general.purchase_date')}>
                        <Datepicker
                            initialDate={purchaseDate}
                            onDateChange={(event, date) => date && setPurchaseDate(date)}
                        />
                    </FormRow>
                    <FormTextInput
                        label={t('general.purchase_cost')}
                        value={purchaseCost}
                        onChangeText={setPurchaseCost}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                    />
                    <FormTextInput
                        label={t('general.order_number')}
                        value={orderNumber}
                        onChangeText={setOrderNumber}
                        placeholder={t('general.order_number')}
                    />
                    <SelectorButton
                        label={t('general.supplier')}
                        value={selectedSupplier?.name}
                        placeholder={t('general.select')}
                        onPress={() => supplierRef.current?.present()}
                    />
                </Section>

                {/* Notes */}
                <Section title={t('mobile.section_notes')}>
                    <FormTextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={t('general.notes')}
                        multiline
                    />
                </Section>

                {/* Submit */}
                {!editDenied && (
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
                )}
            </ScrollView>
            </KeyboardAvoidingView>

            <SelectCategoryBottomSheet
                title={t('general.select_category')}
                ref={categoryRef}
                setSelectedCategory={setSelectedCategory}
            />
            <SelectManufacturerBottomSheet
                title={t('general.select_manufacturer')}
                ref={manufacturerRef}
                setSelectedManufacturer={setSelectedManufacturer}
            />
            <SelectSupplierBottomSheet
                title={t('mobile.select_supplier')}
                ref={supplierRef}
                setSelectedSupplier={setSelectedSupplier}
            />
            <SelectCompanyBottomSheet
                title={t('mobile.select_company')}
                ref={companyRef}
                setSelectedCompany={setSelectedCompany}
            />
            <SelectLocationBottomSheet
                title={t('general.select_location')}
                ref={locationRef}
                setSelectedLocation={setSelectedLocation}
            />
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
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
