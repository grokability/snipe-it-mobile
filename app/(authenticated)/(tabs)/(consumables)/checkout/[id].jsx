import React, {useCallback, useMemo, useRef, useState} from 'react';
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
import {decode} from 'html-entities';
import SelectUserBottomSheet from '@/components/bottomSheets/SelectUserBottomSheet';
import {Section} from '@/components/ui/Section';
import {FormTextInput} from '@/components/forms/FormTextInput';
import {SelectorButton} from '@/components/forms/SelectorButton';

export default function ConsumableCheckoutScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const {id} = useLocalSearchParams();

    const [consumable, setConsumable] = useState(null);
    const { denied: checkoutDenied } = usePermission(PERMISSIONS.CONSUMABLES_CHECKOUT);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [qty, setQty] = useState('1');
    const [note, setNote] = useState('');

    const userRef = useRef(null);

    const fetchConsumable = useCallback(() => {
        setLoading(true);
        return makeRequest({url: `/consumables/${id}`, method: 'get', permissionKey: PERMISSIONS.CONSUMABLES_VIEW})
            .then(setConsumable)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    useFocusEffect(useCallback(() => {
        fetchConsumable();
    }, [fetchConsumable]));

    const handleSubmit = () => {
        if (!selectedUser) {
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.consumable_user_required'),
                duration: 2,
            });
            return;
        }

        const parsedQty = parseInt(qty);
        const maxQty = consumable?.remaining ?? 1;
        if (!parsedQty || parsedQty < 1 || parsedQty > maxQty) {
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
            url: `/consumables/${id}/checkout`,
            method: 'POST',
            permissionKey: PERMISSIONS.CONSUMABLES_CHECKOUT,
            data: {
                assigned_to: selectedUser.id,
                checkout_qty: parsedQty,
                note: note || null,
            },
        })
            .then((res) => {
                if (res === null) return;
                if (res.status === 'error') {
                    const errMsg = typeof res.messages === 'string'
                        ? res.messages
                        : res.messages
                            ? Object.values(res.messages).flat().join('\n')
                            : t('mobile.consumable_checkout_failed');
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
                    message: t('mobile.consumable_checkout_success'),
                    duration: 2,
                });
                router.replace(`/(tabs)/(consumables)/${id}`);
            })
            .catch((err) => {
                console.error(err);
                Burnt.alert({
                    title: t('general.error'),
                    preset: 'error',
                    message: t('mobile.consumable_checkout_failed'),
                    duration: 4,
                });
            })
            .finally(() => setSubmitting(false));
    };

    if (loading || !consumable) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const remaining = consumable.remaining ?? 0;
    const total = consumable.qty ?? 0;

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
                {/* Consumable info header */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoName}>{decode(consumable.name ?? '')}</Text>
                    <Text style={styles.infoQty}>
                        {t('mobile.remaining_qty_display', {remaining, total})}
                    </Text>
                </View>

                {/* Assign to user */}
                <Section title={t('mobile.checkout_to')}>
                    <SelectorButton
                        label={t('general.select_user')}
                        value={selectedUser ? decode(selectedUser.name) : undefined}
                        placeholder={t('general.select')}
                        onPress={() => userRef.current?.present()}
                    />
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
                {!checkoutDenied && (
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
                )}
            </ScrollView>
            </KeyboardAvoidingView>

            <SelectUserBottomSheet
                title={t('general.select_user')}
                ref={userRef}
                setSelectedUser={setSelectedUser}
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
