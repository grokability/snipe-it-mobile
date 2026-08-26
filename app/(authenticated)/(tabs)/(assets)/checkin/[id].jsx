import React, {useMemo, useRef, useState} from 'react';
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
import {decode} from 'html-entities';
import {router, useLocalSearchParams} from 'expo-router';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {makeRequest} from '@/helpers/axiosConfig';
import {assetKeys} from '@/helpers/queryKeys';
import {PERMISSIONS} from '@/permissions/PermissionKeys';
import {PermissionGate} from '@/permissions/PermissionGate';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import * as Burnt from 'burnt';
import {Section} from '@/components/ui/Section';
import {FormTextInput} from '@/components/forms/FormTextInput';
import SelectStatusBottomSheet from '@/components/bottomSheets/SelectStatusBottomSheet';
import {SelectorButton} from '@/components/forms/SelectorButton';

export default function CheckinScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const {id, assetName, assetTag, assignedToName, statusId, statusName} = useLocalSearchParams();
    const queryClient = useQueryClient();

    const statusBottomSheetRef = useRef(null);
    const [selectedStatus, setSelectedStatus] = useState(
        statusId ? { id: parseInt(statusId), name: statusName, value: parseInt(statusId) } : null
    );
    const [note, setNote] = useState('');

    const checkinMutation = useMutation({
        mutationFn: (data) => makeRequest({
            url: `/hardware/${id}/checkin`,
            method: 'POST',
            permissionKey: PERMISSIONS.ASSETS_CHECKIN,
            data,
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
            queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) }).catch(() => {});
            queryClient.invalidateQueries({ queryKey: assetKeys.lists() }).catch(() => {});
            router.dismissTo(`/(tabs)/(assets)/${id}`);
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
        checkinMutation.mutate({
            status_id: selectedStatus?.id ?? (parseInt(statusId) || 1),
            note: note || null,
        });
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
                {/* Asset info */}
                <View style={styles.infoCard}>
                    {assetName ? <Text style={styles.infoName}>{decode(assetName)}</Text> : null}
                    {assetTag ? <Text style={styles.infoTag}>{assetTag}</Text> : null}
                    {assignedToName ? (
                        <>
                            <Text style={styles.infoLabel}>{t('general.assigned_to')}</Text>
                            <Text style={styles.infoAssigned}>{decode(assignedToName)}</Text>
                        </>
                    ) : null}
                </View>

                <Section title={t('general.select_statuslabel')}>
                    <SelectorButton
                        label={t('general.select_statuslabel')}
                        value={selectedStatus ? decode(selectedStatus.name) : undefined}
                        placeholder={t('mobile.optional_default_deployable')}
                        onPress={() => statusBottomSheetRef.current?.present()}
                    />
                </Section>

                <Section title={t('general.notes')}>
                    <FormTextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder={t('general.notes')}
                        multiline
                    />
                </Section>

                <PermissionGate permission={PERMISSIONS.ASSETS_CHECKIN}>
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

            <SelectStatusBottomSheet
                title={t('general.select_statuslabel')}
                ref={statusBottomSheetRef}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
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
    infoLabel: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: Spacing.sm,
    },
    infoAssigned: {
        fontSize: Typography.body,
        fontWeight: FontWeight.medium,
        color: colors.text,
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
