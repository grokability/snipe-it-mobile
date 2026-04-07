import React, {useCallback, useContext, useState, useMemo, useRef} from 'react';
import {decode} from "html-entities";
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
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import * as Burnt from 'burnt';
import SelectCategoryBottomSheet from "@/components/bottomSheets/SelectCategoryBottomSheet";
import SelectManufacturerBottomSheet from "@/components/bottomSheets/SelectManufacturerBottomSheet";
import SelectSupplierBottomSheet from "@/components/bottomSheets/SelectSupplierBottomSheet";
import SelectCompanyBottomSheet from "@/components/bottomSheets/SelectCompanyBottomSheet";
import SelectLocationBottomSheet from "@/components/bottomSheets/SelectLocationBottomSheet";
import Datepicker from "@/components/forms/Datepicker";
import Switch from "@/components/forms/Switch";
import {Section} from "@/components/ui/Section";
import {FormRow} from "@/components/forms/FormRow";
import {FormTextInput} from "@/components/forms/FormTextInput";
import {SelectorButton} from "@/components/forms/SelectorButton";

function parseLocalDate(dateStr) {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
}

export default function EditAccessoryScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { id } = useLocalSearchParams();

    // Text fields
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');
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

    const getAccessory = useCallback(() => {
        setLoading(true);
        return makeRequest({ url: `/accessories/${id}`, method: 'get' })
            .then((accessory) => {
                populateFields(accessory);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    const populateFields = (accessory) => {
        setName(accessory.name ? decode(accessory.name) : '');
        setQty(accessory.qty != null ? String(accessory.qty) : '');
        setModelNumber(accessory.model_number ? decode(accessory.model_number) : '');
        setOrderNumber(accessory.order_number ? decode(accessory.order_number) : '');
        setPurchaseCost(accessory.purchase_cost || '');
        setMinAmt(accessory.min_amt != null ? String(accessory.min_amt) : '');
        setNotes(accessory.notes ? decode(accessory.notes) : '');

        if (accessory.category) {
            setSelectedCategory({ id: accessory.category.id, name: decode(accessory.category.name) });
        }
        if (accessory.manufacturer) {
            setSelectedManufacturer({ id: accessory.manufacturer.id, name: decode(accessory.manufacturer.name) });
        }
        if (accessory.supplier) {
            setSelectedSupplier({ id: accessory.supplier.id, name: decode(accessory.supplier.name) });
        }
        if (accessory.company) {
            setSelectedCompany({ id: accessory.company.id, name: decode(accessory.company.name) });
        }
        if (accessory.location) {
            setSelectedLocation({ id: accessory.location.id, name: decode(accessory.location.name) });
        }
        if (accessory.purchase_date?.date) {
            setPurchaseDate(parseLocalDate(accessory.purchase_date.date));
        }
        setRequestable(!!accessory.requestable);
    };

    useFocusEffect(
        useCallback(() => {
            getAccessory();
        }, [getAccessory])
    );

    const formatDateForApi = (date) => {
        if (!date) return undefined;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.accessory_name_required'),
                duration: 2,
            });
            return;
        }
        if (!qty.trim()) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.accessory_qty_required'),
                duration: 2,
            });
            return;
        }
        if (!selectedCategory) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('general.category') + ' ' + t('mobile.accessory_name_required').toLowerCase(),
                duration: 2,
            });
            return;
        }

        setSubmitting(true);

        const data = {
            name: name,
            qty: parseInt(qty, 10),
            category_id: selectedCategory.id,
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
        };

        makeRequest({
            url: `/accessories/${id}`,
            method: 'PUT',
            data,
        })
            .then((response) => {
                if (response.status === 'error') {
                    Burnt.alert({
                        title: t('general.error'),
                        preset: 'error',
                        message: response.messages
                            ? Object.values(response.messages).flat().join('\n')
                            : t('mobile.edit_accessory_failed'),
                        duration: 4,
                    });
                    return;
                }
                Burnt.alert({
                    title: t('general.notification_success'),
                    preset: 'heart',
                    message: t('mobile.edit_accessory_success'),
                    duration: 2,
                });
                router.replace(`/(tabs)/(accessories)/${id}`);
            })
            .catch((error) => {
                console.error(error);
                Burnt.alert({
                    title: t('general.error'),
                    preset: 'error',
                    message: t('mobile.edit_accessory_failed'),
                    duration: 4,
                });
            })
            .finally(() => {
                setSubmitting(false);
            });
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
            </KeyboardAvoidingView>

            {/* Bottom Sheets */}
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
