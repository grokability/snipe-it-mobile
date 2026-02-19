import React, {useContext, useEffect, useState, useMemo} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AuthContext } from '@/context/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import BrowserLoginButton from '@/components/auth/BrowserLoginButton';
import BearerTokenLogin from "@/components/auth/BearerTokenLogin";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

console.log('login rendered')
export default function LoginScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { login, bearerLogin } = useContext(AuthContext);
    const [domain, setDomain] = useState('https://example.example.com');
    const [token, setToken] = useState('');

    const handleDomainChange = (newDomain) => {
        setDomain(newDomain);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('mobile.login_title')}</Text>
            <LoginForm onLogin={login} onDomainChange={handleDomainChange} />
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
        backgroundColor: colors.background,
    },
    input: {
        height: 40,
        borderColor: colors.textSecondary,
        borderWidth: 1,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        width: '100%',
    },
    title: {
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xl,
        color: colors.text,
    },
});
