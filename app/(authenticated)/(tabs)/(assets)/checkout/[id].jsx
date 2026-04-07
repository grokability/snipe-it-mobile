import React, {useContext, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {makeRequest} from '@/helpers/axiosConfig';
import {AuthContext} from '@/context/AuthProvider';
import SelectUserBottomSheet from '@/components/bottomSheets/SelectUserBottomSheet';
import SelectStatusBottomSheet from '@/components/bottomSheets/SelectStatusBottomSheet';
import SelectLocationBottomSheet from '@/components/bottomSheets/SelectLocationBottomSheet';
import SelectAssetBottomSheet from '@/components/bottomSheets/SelectAssetBottomSheet';
import * as Burnt from 'burnt';
import {CheckoutPicker} from '@/components/misc/CheckoutPicker';
import Datepicker from '@/components/forms/Datepicker';
import {decode} from 'html-entities';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, Typography, FontWeight, BorderRadius} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import {Section} from '@/components/ui/Section';
import {FormRow} from '@/components/forms/FormRow';
import {FormTextInput} from '@/components/forms/FormTextInput';
import {SelectorButton} from '@/components/forms/SelectorButton';

export default function CheckoutScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const {id, assetName: initialAssetName, assetTag} = useLocalSearchParams();
    const {user} = useContext(AuthContext);

    const userBottomSheetRef = useRef(null);
    const statusBottomSheetRef = useRef(null);
    const locationBottomSheetRef = useRef(null);
    const assetBottomSheetRef = useRef(null);

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedCheckoutTo, setSelectedCheckoutTo] = useState('user');
    const [assetName, setAssetName] = useState('');
    const [notes, setNotes] = useState('');
    const [checkoutDate, setCheckoutDate] = useState(null);
    const [expectedCheckinDate, setExpectedCheckinDate] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!selectedStatus) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.status_and_target_required'),
                duration: 2,
            });
            return;
        }

        const target = selectedCheckoutTo === 'user' ? selectedUser
            : selectedCheckoutTo === 'location' ? selectedLocation
            : selectedAsset;

        if (!target) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.status_and_target_required'),
                duration: 2,
            });
            return;
        }

        setSubmitting(true);
        makeRequest({
            url: `/hardware/${id}/checkout`,
            method: 'POST',
            data: {
                name: assetName || undefined,
                checkout_to_type: selectedCheckoutTo,
                assigned_user: selectedUser?.id,
                assigned_location: selectedLocation?.id,
                assigned_asset: selectedAsset?.id,
                status_id: selectedStatus.value,
                checkout_at: checkoutDate,
                expected_checkin: expectedCheckinDate,
                note: notes || undefined,
            },
        })
            .then((res) => {
                if (res.status === 'error') {
                    const msg = typeof res.messages === 'string'
                        ? res.messages
                        : res.messages
                            ? Object.values(res.messages).flat().join('\n')
                            : t('mobile.checkout_failed');
                    Burnt.alert({
                        title: t('general.error'),
                        preset: 'error',
                        message: msg,
                        duration: 4,
                    });
                    return;
                }
                Burnt.alert({
                    title: t('general.notification_success'),
                    preset: 'heart',
                    duration: 2,
                });
                router.replace(`/(tabs)/(assets)/${id}`);
            })
            .catch((err) => {
                console.error(err);
                Burnt.alert({
                    title: t('general.error'),
                    preset: 'error',
                    message: t('mobile.checkout_failed'),
                    duration: 4,
                });
            })
            .finally(() => setSubmitting(false));
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
                {/* Asset info */}
                {(initialAssetName || assetTag) && (
                    <View style={styles.infoCard}>
                        {initialAssetName ? <Text style={styles.infoName}>{decode(initialAssetName)}</Text> : null}
                        {assetTag ? <Text style={styles.infoTag}>{assetTag}</Text> : null}
                    </View>
                )}

                {/* Asset name override */}
                <Section title={t('general.asset_name')}>
                    <FormTextInput
                        value={assetName}
                        onChangeText={setAssetName}
                        placeholder={t('general.asset_name')}
                    />
                    {selectedAsset && (
                        <Text style={styles.hint}>{decode(selectedAsset.name)}</Text>
                    )}
                </Section>

                {/* Status */}
                <Section title={t('general.select_statuslabel')}>
                    <SelectorButton
                        label={t('general.select_statuslabel')}
                        value={selectedStatus ? decode(selectedStatus.name) : undefined}
                        placeholder={t('general.select')}
                        onPress={() => statusBottomSheetRef.current?.present()}
                    />
                </Section>

                {/* Checkout to */}
                <Section title={t('mobile.checkout_to')}>
                    <CheckoutPicker
                        selectedCheckoutTo={selectedCheckoutTo}
                        setSelectedCheckoutTo={(val) => {
                            setSelectedCheckoutTo(val);
                            setSelectedUser(null);
                            setSelectedLocation(null);
                            setSelectedAsset(null);
                        }}
                    />
                    {selectedCheckoutTo === 'user' && (
                        <SelectorButton
                            label={t('general.select_user')}
                            value={selectedUser ? decode(selectedUser.name) : undefined}
                            placeholder={t('general.select')}
                            onPress={() => userBottomSheetRef.current?.present()}
                        />
                    )}
                    {selectedCheckoutTo === 'location' && (
                        <SelectorButton
                            label={t('general.select_location')}
                            value={selectedLocation ? decode(selectedLocation.name) : undefined}
                            placeholder={t('general.select')}
                            onPress={() => locationBottomSheetRef.current?.present()}
                        />
                    )}
                    {selectedCheckoutTo === 'asset' && (
                        <SelectorButton
                            label={t('general.select_asset')}
                            value={selectedAsset ? decode(selectedAsset.name) : undefined}
                            placeholder={t('general.select')}
                            onPress={() => assetBottomSheetRef.current?.present()}
                        />
                    )}
                </Section>

                {/* Dates */}
                <Section title={t('general.checkout_date')}>
                    <FormRow label={t('general.checkout_date')}>
                        <Datepicker onDateChange={(_, date) => date && setCheckoutDate(date)} />
                    </FormRow>
                    <FormRow label={t('general.expected_checkin')}>
                        <Datepicker onDateChange={(_, date) => date && setExpectedCheckinDate(date)} />
                    </FormRow>
                </Section>

                {/* Notes */}
                <Section title={t('general.notes')}>
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
                        <Text style={styles.submitButtonText}>{t('general.checkout')}</Text>
                    )}
                </Pressable>
            </ScrollView>
            </KeyboardAvoidingView>

            <SelectStatusBottomSheet
                title={t('general.select_statuslabel')}
                ref={statusBottomSheetRef}
                setSelectedStatus={setSelectedStatus}
            />
            <SelectUserBottomSheet
                title={t('general.select_user')}
                ref={userBottomSheetRef}
                setSelectedUser={setSelectedUser}
            />
            <SelectLocationBottomSheet
                title={t('general.select_location')}
                ref={locationBottomSheetRef}
                setSelectedLocation={setSelectedLocation}
            />
            <SelectAssetBottomSheet
                title={t('general.select_asset')}
                ref={assetBottomSheetRef}
                setSelectedAsset={setSelectedAsset}
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
    infoCard: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    infoName: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    infoTag: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    hint: {
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
