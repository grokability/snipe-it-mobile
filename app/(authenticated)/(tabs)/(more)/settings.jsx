import {View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AuthContext} from "@/context/AuthProvider";
import {useContext, useMemo, useState} from "react";
import * as SecureStore from 'expo-secure-store';
import {Image} from 'expo-image';
import {useQueryClient} from '@tanstack/react-query';
import {useColors} from "@/hooks/useThemeColors";
import {Typography, Spacing, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {PermissionManager} from "@/permissions/PermissionManager";
import {SegmentedPicker} from "@/components/ui/SegmentedPicker";
import {ErrorReportingConsent, getErrorReportingConsent} from "@/helpers/errorReportingConsent";
import {applyErrorReportingConsent} from "@/helpers/sentry";
import * as Sentry from "@sentry/react-native";
import Switch from "@/components/forms/Switch";
import {getEnableSounds, setEnableSounds} from "@/helpers/scanSound";

export default function SettingsScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { logout, user } = useContext(AuthContext);
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [clearingCaches, setClearingCaches] = useState(false);
    const [errorReporting, setErrorReporting] = useState(getErrorReportingConsent);
    const [enableSounds, setEnableSoundsState] = useState(getEnableSounds);

    const errorReportingOptions = useMemo(() => [
        {value: ErrorReportingConsent.ALWAYS, label: t('mobile.error_reporting_always')},
        {value: ErrorReportingConsent.ASK, label: t('mobile.error_reporting_ask')},
        {value: ErrorReportingConsent.NEVER, label: t('mobile.error_reporting_never')},
    ], [t]);

    // Each state describes what it actually does, including the part the app cannot control:
    // a crash that closes the app leaves nothing running to ask with, so under Ask those still
    // go out. Never is the only setting that stops them, because it skips Sentry's
    // initialization entirely and the native crash handler is never installed.
    const errorReportingDescriptions = {
        [ErrorReportingConsent.ALWAYS]: t('mobile.error_reporting_always_description'),
        [ErrorReportingConsent.ASK]: t('mobile.error_reporting_ask_description'),
        [ErrorReportingConsent.NEVER]: t('mobile.error_reporting_never_description'),
    };

    // Exercises the reporting pipeline the way a real error does: scrubEvent, the consent
    // gate, the prompt when consent is ASK, the send, and the reference the Help screen reads.
    //
    // The message carries a timestamp because the pending queue fingerprints an event by its
    // shape, and a signature already answered this session is dropped rather than queued
    // again. Repeat triggers with identical text would silently do nothing, which reads as
    // the feature being broken rather than as the dedupe working.
    const testErrorMessage = () => `Test error report ${new Date().toISOString()}`;

    const handleTriggerHandledError = () => {
        Sentry.captureException(new Error(testErrorMessage()));
    };

    // Thrown from a timer so it reaches the global handler unhandled, which is the path a
    // real crash takes. In a dev build LogBox shows its own screen over the consent prompt;
    // dismiss it and the prompt is underneath.
    const handleTriggerUnhandledError = () => {
        setTimeout(() => {
            throw new Error(testErrorMessage());
        }, 0);
    };

    const handleErrorReportingChange = async (consent) => {
        setErrorReporting(consent);
        await applyErrorReportingConsent(consent);
    };

    const handleEnableSoundsChange = (enabled) => {
        setEnableSoundsState(enabled);
        setEnableSounds(enabled);
    };

    const handleRefreshPermissions = async () => {
        setRefreshing(true);
        try {
            const domain = SecureStore.getItem('domain');
            const success = await PermissionManager.refreshPermissions(domain, user.token);
            const message = success ? t('mobile.refresh_permissions_success') : t('mobile.refresh_permissions_error');
            Alert.alert(t('mobile.refresh_permissions'), message, [{ text: t('mobile.ok') }]);
        } catch {
            Alert.alert(t('mobile.refresh_permissions'), t('mobile.refresh_permissions_error'), [{ text: t('mobile.ok') }]);
        } finally {
            setRefreshing(false);
        }
    };

    const handleClearAllCaches = async () => {
        setClearingCaches(true);
        try {
            queryClient.clear();
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
            await Promise.race([
                Promise.allSettled([Image.clearMemoryCache(), Image.clearDiskCache()]),
                timeout,
            ]);
            Alert.alert(t('mobile.clear_all_caches'), t('mobile.clear_all_caches_success'), [{ text: t('mobile.ok') }]);
        } catch {
            Alert.alert(t('mobile.clear_all_caches'), t('mobile.clear_all_caches_error'), [{ text: t('mobile.ok') }]);
        } finally {
            setClearingCaches(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.contentContainer, {paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0}]}
        >
            <Text style={styles.text}>{t('mobile.domain_message', { domain: SecureStore.getItem('domain') })}</Text>
            <Text style={[styles.text, {paddingBottom: Spacing.lg}]}>{t('general.settings')}</Text>
            <TouchableOpacity onPress={handleRefreshPermissions} disabled={refreshing} style={styles.button}>
                {refreshing
                    ? <ActivityIndicator size="small" color={colors.text} />
                    : <Text style={styles.text}>{t('mobile.refresh_permissions')}</Text>
                }
            </TouchableOpacity>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('mobile.error_reporting')}</Text>
                <SegmentedPicker
                    options={errorReportingOptions}
                    selectedValue={errorReporting}
                    onValueChange={(consent) => handleErrorReportingChange(consent)}
                />
                <Text style={styles.sectionDescription}>{errorReportingDescriptions[errorReporting]}</Text>
            </View>
            <View style={styles.section}>
                <View style={styles.switchRow}>
                    <Text style={styles.sectionTitle}>{t('account.general.enable_sounds')}</Text>
                    <Switch value={enableSounds} onValueChange={(enabled) => handleEnableSoundsChange(enabled)} />
                </View>
                <Text style={styles.sectionDescription}>{t('mobile.enable_sounds_description')}</Text>
            </View>
            {__DEV__ && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('mobile.dev_error_reporting_test')}</Text>
                    <TouchableOpacity onPress={() => handleTriggerHandledError()} style={styles.button}>
                        <Text style={styles.text}>{t('mobile.dev_trigger_handled_error')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleTriggerUnhandledError()} style={styles.button}>
                        <Text style={styles.text}>{t('mobile.dev_trigger_unhandled_error')}</Text>
                    </TouchableOpacity>
                </View>
            )}
            {__DEV__ && (
                <TouchableOpacity onPress={handleClearAllCaches} disabled={clearingCaches} style={styles.button}>
                    {clearingCaches
                        ? <ActivityIndicator size="small" color={colors.text} />
                        : <Text style={styles.text}>{t('mobile.clear_all_caches')}</Text>
                    }
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={logout}>
                <Text style={styles.text}>{t('general.logout')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: colors.text,
        fontSize: Typography.body,
    },
    section: {
        alignSelf: 'stretch',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    sectionTitle: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    sectionDescription: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        lineHeight: Typography.caption * 1.4,
    },
    button: {
        marginBottom: Spacing.md,
        minHeight: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
