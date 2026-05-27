import {View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {AuthContext} from "@/context/AuthProvider";
import {useContext, useMemo, useState} from "react";
import * as SecureStore from 'expo-secure-store';
import {useColors} from "@/hooks/useThemeColors";
import {Typography, Spacing} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {PermissionManager} from "@/permissions/PermissionManager";

export default function SettingsScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { logout, user } = useContext(AuthContext);
    const { t } = useTranslation();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefreshPermissions = async () => {
        setRefreshing(true);
        try {
            const domain = SecureStore.getItem('domain');
            const success = await PermissionManager.refreshPermissions(domain, user.token);
            const message = success ? t('mobile.refresh_permissions_success') : t('mobile.refresh_permissions_error');
            Alert.alert(t('mobile.refresh_permissions'), message, [{ text: t('general.ok') }]);
        } catch {
            Alert.alert(t('mobile.refresh_permissions'), t('mobile.refresh_permissions_error'), [{ text: t('general.ok') }]);
        } finally {
            setRefreshing(false);
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
