import {View, Text, StyleSheet, ActivityIndicator, Button, Linking, ScrollView, TouchableOpacity} from 'react-native';
import {useCameraPermissions} from 'expo-camera';
import {router} from "expo-router";
import React, {useMemo} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import ExpoApplication from "expo-application/src/ExpoApplication";
import { useUpdates, reloadAsync, checkForUpdateAsync, fetchUpdateAsync } from 'expo-updates';
import RecentActions from "@/components/misc/RecentActions";
import AuditDashboardCard from "@/components/audit/AuditDashboardCard";
import {useTranslation} from "react-i18next";
import {usePermission} from "@/permissions/PermissionContext";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing} from "@/constants/sizes";

export default function HomeScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { allowed: isSuperuser } = usePermission(PERMISSIONS.SUPERUSER);
    const { allowed: canAudit } = usePermission(PERMISSIONS.ASSETS_AUDIT);
    const [permission, requestPermission] = useCameraPermissions();
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

    if (!permission) {
        return (
            <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background}}>
                <ActivityIndicator size="large" color={colors.primary}/>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 100}]}
                showsVerticalScrollIndicator={false}
            >
                {isSuperuser && (
                    <RecentActions />
                )}

                {canAudit && (
                    <AuditDashboardCard />
                )}

                <View style={styles.scannerSection}>
                    {permission.granted ? (
                        <Button title={t('mobile.open_scanner')} onPress={() => router.push('/scanner')}/>
                    ) : permission.canAskAgain ? (
                        <Button title={t('mobile.request_camera_permissions')} onPress={requestPermission}/>
                    ) : (
                        <Button title={t('mobile.open_settings')} onPress={() => Linking.openSettings()}/>
                    )}
                </View>

                <View style={styles.footer}>
                    <LottieView
                        source={require('@/assets/spinning_star_eye.json')}
                        style={styles.lottie}
                        autoPlay
                        loop
                    />
                    <Text style={styles.welcomeText}>{t('mobile.welcome')}</Text>
                    <Text style={styles.versionText}>
                        {t('mobile.version', { version: ExpoApplication.nativeApplicationVersion, build: ExpoApplication.nativeBuildVersion })}
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
                        <TouchableOpacity onPress={handleCheckForUpdate} disabled={isChecking || isDownloading} activeOpacity={0.6}>
                            <Text style={styles.checkUpdateText}>
                                {isDownloading ? t('mobile.update_downloading') : isChecking ? t('mobile.update_checking') : t('mobile.update_check')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
    },
    scannerSection: {
        alignItems: 'center',
    },
    footer: {
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    lottie: {
        width: 150,
        height: 150,
    },
    welcomeText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
        textAlign: 'center',
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
