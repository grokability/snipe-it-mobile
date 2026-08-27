import {View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {AuthContext} from "@/context/AuthProvider";
import {useContext, useMemo, useState} from "react";
import * as SecureStore from 'expo-secure-store';
import {Image} from 'expo-image';
import {useQueryClient} from '@tanstack/react-query';
import {useColors} from "@/hooks/useThemeColors";
import {Typography, Spacing} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {PermissionManager} from "@/permissions/PermissionManager";

export default function SettingsScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { logout, user } = useContext(AuthContext);
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [clearingCaches, setClearingCaches] = useState(false);

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
        <View style={styles.container}>
            <Text style={styles.text}>{t('mobile.domain_message', { domain: SecureStore.getItem('domain') })}</Text>
            <Text style={[styles.text, {paddingBottom: Spacing.lg}]}>{t('general.settings')}</Text>
            <TouchableOpacity onPress={handleRefreshPermissions} disabled={refreshing} style={styles.button}>
                {refreshing
                    ? <ActivityIndicator size="small" color={colors.text} />
                    : <Text style={styles.text}>{t('mobile.refresh_permissions')}</Text>
                }
            </TouchableOpacity>
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
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    text: {
        color: colors.text,
        fontSize: Typography.body,
    },
    button: {
        marginBottom: Spacing.md,
        minHeight: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
