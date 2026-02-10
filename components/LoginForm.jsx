import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import BrowserLoginButton from "@/components/BrowserLoginButton";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

const LoginForm = ({ onLogin, onDomainChange }) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [domain, setDomain] = useState('https://example.example.com');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const loadDomain = async () => {
            const savedDomain = await SecureStore.getItemAsync('domain');
            if (savedDomain) {
                setDomain(savedDomain);
                if (onDomainChange) onDomainChange(savedDomain);
            }
        };
        loadDomain();
    }, []);

    const handleDomainChange = (text) => {
        setDomain(text);
        if (onDomainChange) onDomainChange(text);
    };

    const handleLogin = async () => {
        try {
            await onLogin(domain);
        } catch (error) {
            Alert.alert(t('login.failed'), t('login.failedMessage'));
        }
    };

    return (
        <>
            <TextInput
                placeholder={t('login.domain')}
                onChangeText={handleDomainChange}
                value={domain}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                textContentType="URL"
                autoCapitalize="none"
            />
            <TouchableOpacity onPress={handleLogin}>

                <BrowserLoginButton domain={domain} />
            </TouchableOpacity>
        </>
    );
};

const createStyles = (colors) => StyleSheet.create({
    input: {
        height: 40,
        borderColor: colors.border,
        borderWidth: 1,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        width: '100%',
        borderRadius: BorderRadius.sm,
        fontSize: Typography.body,
        color: colors.text,
        backgroundColor: colors.background,
    },
});

export default LoginForm;
