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
import {makeRequest} from '@/helpers/axiosConfig';
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
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        setSubmitting(true);
        makeRequest({
            url: `/accessories/${checkoutRecordId}/checkin`,
            method: 'POST',
            data: {note: note || null},
            permissionKey: PERMISSIONS.ACCESSORIES_CHECKIN,
        })
            .then((res) => {
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
                router.replace(`/(tabs)/(accessories)/${id}`);
            })
            .catch((err) => {
                console.error(err);
                Burnt.alert({
                    title: t('general.error'),
                    preset: 'error',
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
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top}]}
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
