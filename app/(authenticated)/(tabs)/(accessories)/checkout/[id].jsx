import React, {useCallback, useContext, useMemo, useRef, useState} from 'react';
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
import {AuthContext} from '@/context/AuthProvider';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import * as Burnt from 'burnt';
import {decode} from 'html-entities';
import {CheckoutPicker} from '@/components/misc/CheckoutPicker';
import SelectUserBottomSheet from '@/components/bottomSheets/SelectUserBottomSheet';
import SelectLocationBottomSheet from '@/components/bottomSheets/SelectLocationBottomSheet';
import SelectAssetBottomSheet from '@/components/bottomSheets/SelectAssetBottomSheet';
import {Section} from '@/components/ui/Section';
import {FormRow} from '@/components/forms/FormRow';
import {FormTextInput} from '@/components/forms/FormTextInput';
import {SelectorButton} from '@/components/forms/SelectorButton';

export default function AccessoryCheckoutScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const {id} = useLocalSearchParams();

    const [accessory, setAccessory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [checkoutTo, setCheckoutTo] = useState('user');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [qty, setQty] = useState('1');
    const [note, setNote] = useState('');

    const userRef = useRef(null);
    const locationRef = useRef(null);
    const assetRef = useRef(null);

    const fetchAccessory = useCallback(() => {
        setLoading(true);
        return makeRequest({url: `/accessories/${id}`, method: 'get'})
            .then(setAccessory)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useFocusEffect(useCallback(() => {
        fetchAccessory();
    }, [fetchAccessory]));

    const getTarget = () => {
        if (checkoutTo === 'user') return selectedUser;
        if (checkoutTo === 'location') return selectedLocation;
        return selectedAsset;
    };

    const handleSubmit = () => {
        const target = getTarget();
        if (!target) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.status_and_target_required'),
                duration: 2,
            });
            return;
        }

        const parsedQty = parseInt(qty);
        const maxQty = accessory?.remaining_qty ?? 1;
        if (!parsedQty || parsedQty < 1 || parsedQty > maxQty) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.accessory_qty_required'),
                duration: 2,
            });
            return;
        }

        setSubmitting(true);

        const data = {
            checkout_to_type: checkoutTo,
            ...(checkoutTo === 'user' && {assigned_user: selectedUser.id}),
            ...(checkoutTo === 'location' && {assigned_location: selectedLocation.id}),
            ...(checkoutTo === 'asset' && {assigned_asset: selectedAsset.id}),
            checkout_qty: parsedQty,
            note: note || null,
        };

        makeRequest({url: `/accessories/${id}/checkout`, method: 'POST', data})
            .then((res) => {
                if (res.status === 'error') {
                    Burnt.alert({
                        title: t('general.error'),
                        preset: 'error',
                        message: res.messages
                            ? Object.values(res.messages).flat().join('\n')
                            : t('mobile.accessory_checkout_failed'),
                        duration: 4,
                    });
                    return;
                }
                Burnt.alert({
                    title: t('general.notification_success'),
                    preset: 'heart',
                    message: t('mobile.accessory_checkout_success'),
                    duration: 2,
                });
                router.replace(`/(tabs)/(accessories)/${id}`);
            })
            .catch((err) => {
                console.error(err);
                Burnt.alert({
                    title: t('general.error'),
                    preset: 'error',
                    message: t('mobile.accessory_checkout_failed'),
                    duration: 4,
                });
            })
            .finally(() => setSubmitting(false));
    };

    if (loading || !accessory) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const remaining = accessory.remaining_qty ?? 0;
    const total = accessory.qty ?? 0;

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
                {/* Accessory info header */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoName}>{decode(accessory.name ?? '')}</Text>
                    <Text style={styles.infoQty}>
                        {t('mobile.remaining_qty_display', {remaining, total})}
                    </Text>
                </View>

                {/* Checkout to */}
                <Section title={t('mobile.checkout_to')}>
                    <CheckoutPicker
                        selectedCheckoutTo={checkoutTo}
                        setSelectedCheckoutTo={(val) => {
                            setCheckoutTo(val);
                            setSelectedUser(null);
                            setSelectedLocation(null);
                            setSelectedAsset(null);
                        }}
                    />

                    {checkoutTo === 'user' && (
                        <SelectorButton
                            label={t('general.select_user')}
                            value={selectedUser ? decode(selectedUser.name) : undefined}
                            placeholder={t('general.select')}
                            onPress={() => userRef.current?.present()}
                        />
                    )}
                    {checkoutTo === 'location' && (
                        <SelectorButton
                            label={t('general.select_location')}
                            value={selectedLocation ? decode(selectedLocation.name) : undefined}
                            placeholder={t('general.select')}
                            onPress={() => locationRef.current?.present()}
                        />
                    )}
                    {checkoutTo === 'asset' && (
                        <SelectorButton
                            label={t('general.select_asset')}
                            value={selectedAsset ? decode(selectedAsset.name) : undefined}
                            placeholder={t('general.select')}
                            onPress={() => assetRef.current?.present()}
                        />
                    )}
                </Section>

                {/* Quantity */}
                <Section title={t('mobile.checkout_qty_label')}>
                    <FormTextInput
                        label={t('mobile.checkout_qty_label')}
                        value={qty}
                        onChangeText={setQty}
                        placeholder={t('mobile.checkout_qty_placeholder')}
                        keyboardType="number-pad"
                    />
                    <Text style={styles.qtyHint}>
                        {t('mobile.remaining_qty_display', {remaining, total})}
                    </Text>
                </Section>

                {/* Note */}
                <Section title={t('general.notes')}>
                    <FormTextInput
                        value={note}
                        onChangeText={setNote}
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
                        <Text style={styles.submitButtonText}>{t('general.checkout')}</Text>
                    )}
                </Pressable>
            </ScrollView>
            </KeyboardAvoidingView>

            <SelectUserBottomSheet
                title={t('general.select_user')}
                ref={userRef}
                setSelectedUser={setSelectedUser}
            />
            <SelectLocationBottomSheet
                title={t('general.select_location')}
                ref={locationRef}
                setSelectedLocation={setSelectedLocation}
            />
            <SelectAssetBottomSheet
                title={t('general.select_asset')}
                ref={assetRef}
                setSelectedAsset={setSelectedAsset}
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
    infoCard: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoName: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
        textAlign: 'center',
    },
    infoQty: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    qtyHint: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        marginTop: -Spacing.sm,
    },
    submitButton: {
        backgroundColor: colors.success,
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
