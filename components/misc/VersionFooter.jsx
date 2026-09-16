import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ExpoApplication from 'expo-application/src/ExpoApplication';
import { useUpdates, reloadAsync, checkForUpdateAsync, fetchUpdateAsync } from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useThemeColors';
import { Typography, FontWeight, Spacing } from '@/constants/sizes';

// Shown on both the home screen and the login screen. On login it matters because fixes ship
// as OTA updates: someone retrying a failed login needs to confirm they are actually running
// the build that contains the fix, and needs a way to pull it down if they are not.
export default function VersionFooter({ style }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { currentlyRunning, isUpdatePending, isChecking, isDownloading, downloadedUpdate } = useUpdates();

    const otaText = currentlyRunning.isEmbeddedLaunch
        ? t('mobile.update_embedded')
        : t('mobile.update_channel', {
            channel: currentlyRunning.channel,
            date: currentlyRunning.createdAt?.toLocaleString(),
          });
    const runningMessage = process.env.EXPO_PUBLIC_UPDATE_MESSAGE;
    const pendingMessage = downloadedUpdate?.manifest?.metadata?.message;

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
            <Text style={styles.versionText}>
                {t('mobile.version', {
                    version: ExpoApplication.nativeApplicationVersion,
                    build: ExpoApplication.nativeBuildVersion,
                })}
            </Text>
            <Text style={styles.versionText}>{otaText}</Text>
            {runningMessage ? (
                <Text style={styles.versionText}>{runningMessage}</Text>
            ) : null}
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
                    <Text style={styles.checkUpdateText}>
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
    checkUpdateText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
});
