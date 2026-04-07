import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {AuthContext} from "@/context/AuthProvider";
import {useContext, useMemo} from "react";
import * as SecureStore from 'expo-secure-store';
import {useColors} from "@/hooks/useThemeColors";
import {Typography, Spacing} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

export default function SettingsScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { logout } = useContext(AuthContext);
    const { t } = useTranslation();
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{t('mobile.domain_message', { domain: SecureStore.getItem('domain') })}</Text>
            <Text style={[styles.text, {paddingBottom: Spacing.lg}]}>{t('general.settings')}</Text>
            <TouchableOpacity onPress={logout}>
                <Text style={styles.text}>this was a testflight build, but is now a develop build</Text>
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
});
