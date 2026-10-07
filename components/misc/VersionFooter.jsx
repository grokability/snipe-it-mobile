import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ExpoApplication from 'expo-application/src/ExpoApplication';
import * as Clipboard from 'expo-clipboard';
import * as Burnt from 'burnt';
import { useUpdates, reloadAsync, checkForUpdateAsync, fetchUpdateAsync } from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useThemeColors';
import { useOpenExternalUrl } from '@/hooks/useOpenExternalUrl';
import { Typography, FontWeight, Spacing } from '@/constants/sizes';

// Each beta and production promotion publishes a GitHub Release. The list rather than this
// build's own release, because internal-testing builds have none.
const RELEASES_URL = 'https://github.com/grokability/snipe-it-mobile/releases';

// Shown on both the home screen and the login screen. On login it matters because fixes ship
// as OTA updates: someone retrying a failed login needs to confirm they are actually running
// the build that contains the fix, and needs a way to pull it down if they are not.
export default function VersionFooter({ style }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const openUrl = useOpenExternalUrl();
    const { currentlyRunning, isUpdatePending, isChecking, isDownloading, downloadedUpdate } = useUpdates();

    // One line a tester can read out: the release the running JS was built from, the binary's
    // build number, and the channel. The release number is inlined by the EAS workflow, into
    // both OTA updates and embedded bundles; local and dev builds fall back to app.json's version.
    // It holds no words to translate, and the copied text should be identical in every locale.
    const release = process.env.EXPO_PUBLIC_RELEASE_NUMBER ?? ExpoApplication.nativeApplicationVersion;
    const channel = currentlyRunning.channel || (__DEV__ ? 'development' : 'unknown');
    const releaseText = `${release} (${ExpoApplication.nativeBuildVersion}) · ${channel}`;
    const otaText = currentlyRunning.isEmbeddedLaunch
        ? t('mobile.update_embedded')
        : t('mobile.update_date', { date: currentlyRunning.createdAt?.toLocaleString() });
    const pendingMessage = downloadedUpdate?.manifest?.metadata?.message;

    const handleCopyRelease = async () => {
        const copied = await Clipboard.setStringAsync(releaseText);
        Burnt.toast({
            title: copied ? t('general.copied') : t('general.error'),
            preset: copied ? 'done' : 'error',
            duration: 1.5,
        });
    };

    const handleCheckForUpdate = async () => {
        try {
            const result = await checkForUpdateAsync();
            if (result.isAvailable) {
                await fetchUpdateAsync();
            }
        } catch (error) {
            console.error('Update check failed:', error);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                onPress={handleCopyRelease}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityHint={t('general.copy_to_clipboard')}
            >
                <Text style={styles.versionText}>{releaseText}</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>{otaText}</Text>
            <TouchableOpacity onPress={() => openUrl(RELEASES_URL)} activeOpacity={0.6} accessibilityRole="link">
                <Text style={styles.linkText}>{t('mobile.release_notes')}</Text>
            </TouchableOpacity>
            {isUpdatePending ? (
                <TouchableOpacity style={styles.updateBanner} onPress={reloadAsync} activeOpacity={0.7}>
                    <Text style={styles.updateBannerLabel}>{t('mobile.update_pending')}</Text>
                    {pendingMessage ? (
                        <Text style={styles.updateBannerMessage}>msg: {pendingMessage}</Text>
                    ) : null}
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={handleCheckForUpdate}
                    disabled={isChecking || isDownloading}
                    activeOpacity={0.6}
                >
                    <Text style={styles.linkText}>
                        {isDownloading
                            ? t('mobile.update_downloading')
                            : isChecking
                                ? t('mobile.update_checking')
                                : t('mobile.update_check')}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: Spacing.sm,
    },
    versionText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    updateBanner: {
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    updateBannerLabel: {
        fontSize: Typography.caption,
        color: colors.primary,
        fontWeight: FontWeight.semibold,
        textAlign: 'center',
    },
    updateBannerMessage: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    linkText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
});
