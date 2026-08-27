import React, {useMemo, useState} from 'react';
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
import {router, useLocalSearchParams} from 'expo-router';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {makeRequest} from '@/helpers/axiosConfig';
import {accessoryKeys} from '@/helpers/queryKeys';
import {PERMISSIONS} from '@/permissions/PermissionKeys';
import {PermissionGate} from '@/permissions/PermissionGate';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import * as Burnt from 'burnt';
import {decode} from 'html-entities';
import {Section} from '@/components/ui/Section';
import {FormTextInput} from '@/components/forms/FormTextInput';

export default function AccessoryCheckinScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    const {id, checkoutRecordId, assignedToName, assignedDate} = useLocalSearchParams();
    const queryClient = useQueryClient();
    const [note, setNote] = useState('');

    const checkinMutation = useMutation({
        mutationFn: (data) => makeRequest({
            url: `/accessories/${checkoutRecordId}/checkin`,
            method: 'POST',
            data,
            permissionKey: PERMISSIONS.ACCESSORIES_CHECKIN,
        }),
        onSuccess: (res) => {
            if (res.status === 'error') {
                const msg = typeof res.messages === 'string'
                    ? res.messages
                    : res.messages
                        ? Object.values(res.messages).flat().join('\n')
                        : t('general.checkin') + ' failed';
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
            queryClient.invalidateQueries({ queryKey: accessoryKeys.detail(id) }).catch(() => {});
            queryClient.invalidateQueries({ queryKey: accessoryKeys.lists() }).catch(() => {});
            router.dismissTo(`/(tabs)/(accessories)/${id}`);
        },
        onError: (err) => {
            console.error(err);
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                duration: 4,
            });
        },
    });

    const handleSubmit = () => {
        checkinMutation.mutate({note: note || null});
    };

    return (
        <SafeAreaProvider>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView
                style={styles.container}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.contentContainer, {paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0}]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Record info */}
                <View style={styles.infoCard}>
                    {assignedToName ? (
                        <>
                            <Text style={styles.infoLabel}>{t('general.assigned_to')}</Text>
                            <Text style={styles.infoName}>{decode(assignedToName)}</Text>
                        </>
                    ) : null}
                    {assignedDate ? (
                        <Text style={styles.infoDate}>{assignedDate}</Text>
                    ) : null}
                </View>

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
                <PermissionGate permission={PERMISSIONS.ACCESSORIES_CHECKIN}>
                    <Pressable
                        onPress={handleSubmit}
                        disabled={checkinMutation.isPending}
                        style={({pressed}) => [
                            styles.submitButton,
                            pressed && styles.submitButtonPressed,
                            checkinMutation.isPending && styles.submitButtonDisabled,
                        ]}
                    >
                        {checkinMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>{t('general.checkin')}</Text>
                        )}
                    </Pressable>
                </PermissionGate>
            </ScrollView>
            </KeyboardAvoidingView>
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
    infoLabel: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoName: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    infoDate: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    submitButton: {
        backgroundColor: colors.danger,
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
