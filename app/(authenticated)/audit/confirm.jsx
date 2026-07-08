import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Image,
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
import {makeRequest} from '@/helpers/axiosConfig';
import {PERMISSIONS} from '@/permissions/PermissionKeys';
import {PermissionGate} from '@/permissions/PermissionGate';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import * as Burnt from 'burnt';
import {Section} from '@/components/ui/Section';
import {DetailRow} from '@/components/ui/DetailRow';
import {FormTextInput} from '@/components/forms/FormTextInput';
import {SelectorButton} from '@/components/forms/SelectorButton';
import {FormRow} from '@/components/forms/FormRow';
import Datepicker from '@/components/forms/Datepicker';
import SelectLocationBottomSheet from '@/components/bottomSheets/SelectLocationBottomSheet';
import {useAuditSession} from '@/context/AuditSessionProvider';

function formatDate(dateObj) {
    if (!dateObj) return null;
    if (typeof dateObj === 'object' && dateObj.formatted) return dateObj.formatted;
    if (typeof dateObj === 'object' && dateObj.date) return dateObj.date.substring(0, 10);
    if (typeof dateObj === 'string') return dateObj.substring(0, 10);
    return null;
}

function calculateNextAuditDate(auditInterval) {
    const months = auditInterval || 12;
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().substring(0, 10);
}

export default function AuditConfirmScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const {asset_id, asset_tag, from_scanner} = useLocalSearchParams();
    const {addAuditedAsset} = useAuditSession();

    const locationBottomSheetRef = useRef(null);

    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [nextAuditDate, setNextAuditDate] = useState(null);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // this is going to have to change somehow, maybe an admin setting or something - if it's not an url,
        // it's impossible for the app to tell what the number is... (i don't even know what default is)
        const url = asset_id
            ? `/hardware/${encodeURIComponent(asset_id)}`
            : `/hardware/bytag/${encodeURIComponent(asset_tag)}`;

        makeRequest({url, method: 'GET', permissionKey: PERMISSIONS.ASSETS_AUDIT})
            .then((res) => {
                if (res.status === 'error') {
                    setError(res.messages || t('mobile.audit_failed'));
                    return;
                }
                setAsset(res);
                const interval = res.model?.audit_interval;
                setNextAuditDate(calculateNextAuditDate(interval));
            })
            .catch((err) => {
                console.error(err);
                setError(t('mobile.audit_failed'));
            })
            .finally(() => setLoading(false));
    }, [asset_id, asset_tag]);

    const handleSubmit = () => {
        setSubmitting(true);
        makeRequest({
            url: '/hardware/audit',
            method: 'POST',
            permissionKey: PERMISSIONS.ASSETS_AUDIT,
            data: {
                asset_tag: asset?.asset_tag || asset_tag,
                location_id: selectedLocation?.id || null,
                next_audit_date: nextAuditDate || null,
                note: note || null,
            },
        })
            .then((res) => {
                if (res.status === 'error') {
                    const msg = typeof res.messages === 'string'
                        ? res.messages
                        : res.messages
                            ? Object.values(res.messages).flat().join('\n')
                            : t('mobile.audit_failed');
                    Burnt.alert({
                        title: t('general.error'),
                        preset: 'error',
                        message: msg,
                        duration: 4,
                    });
                    return;
                }
                Burnt.alert({
                    title: t('mobile.audit_success'),
                    preset: 'done',
                    duration: 2,
                });
                if (asset) {
                    addAuditedAsset(asset);
                }
                if (from_scanner === 'true') {
                    router.replace('/scanner?mode=audit');
                } else {
                    router.back();
                }
            })
            .catch((err) => {
                console.error(err);
                Burnt.alert({
                    title: t('general.error'),
                    preset: 'error',
                    message: t('mobile.audit_failed'),
                    duration: 4,
                });
            })
            .finally(() => setSubmitting(false));
    };

    if (loading) {
        return (
            <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, {justifyContent: 'center', alignItems: 'center', padding: Spacing.lg}]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top}]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Asset info card */}
                <View style={styles.infoCard}>
                    {asset?.image && (
                        <Image
                            source={{uri: asset.image}}
                            style={styles.assetImage}
                            resizeMode="contain"
                        />
                    )}
                    <Text style={styles.infoName}>{asset?.name ? decode(asset.name) : (asset_tag || asset_id)}</Text>
                    <Text style={styles.infoTag}>#{asset?.asset_tag}</Text>
                    {asset?.model?.name && (
                        <Text style={styles.infoModel}>{decode(asset.model.name)}</Text>
                    )}
                </View>

                {/* Asset details */}
                <Section title={t('mobile.section_details')}>
                    {asset?.location?.name && (
                        <DetailRow label={t('general.location')} value={decode(asset.location.name)} />
                    )}
                    <DetailRow
                        label={t('general.last_audit_date')}
                        value={formatDate(asset?.last_audit_date) || t('mobile.na')}
                    />
                    <DetailRow
                        label={t('general.next_audit_date')}
                        value={formatDate(asset?.next_audit_date) || t('mobile.na')}
                    />
                </Section>

                {/* Location update (optional) */}
                <Section title={t('mobile.audit_location_update')}>
                    <SelectorButton
                        label={t('general.select_location')}
                        value={selectedLocation ? decode(selectedLocation.name) : undefined}
                        placeholder={t('general.select')}
                        onPress={() => locationBottomSheetRef.current?.present()}
                    />
                </Section>

                {/* Next audit date */}
                <Section title={t('general.next_audit_date')}>
                    <FormRow label={t('general.next_audit_date')}>
                        <Datepicker
                            initialDate={nextAuditDate}
                            onDateChange={(_, date) => {
                                if (date) {
                                    const iso = date.toISOString().substring(0, 10);
                                    setNextAuditDate(iso);
                                }
                            }}
                        />
                    </FormRow>
                </Section>

                {/* Notes */}
                <Section title={t('general.notes')}>
                    <FormTextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder={t('mobile.audit_notes_placeholder')}
                        multiline
                    />
                </Section>

                {/* Submit */}
                <PermissionGate permission={PERMISSIONS.ASSETS_AUDIT}>
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
                            <Text style={styles.submitButtonText}>{t('mobile.audit_submit')}</Text>
                        )}
                    </Pressable>
                </PermissionGate>
            </ScrollView>
            </KeyboardAvoidingView>

            <SelectLocationBottomSheet
                title={t('general.select_location')}
                ref={locationBottomSheetRef}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
            />
        </View>
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
        alignItems: 'center',
    },
    assetImage: {
        width: 120,
        height: 120,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.sm,
    },
    infoName: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
        textAlign: 'center',
    },
    infoTag: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    infoModel: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    errorText: {
        fontSize: Typography.bodyLarge,
        color: colors.danger,
        textAlign: 'center',
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
