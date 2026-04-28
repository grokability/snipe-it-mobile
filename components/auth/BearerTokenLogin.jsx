import React, { useState, useMemo } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius } from "@/constants/sizes";
import { useTranslation } from "react-i18next";

const BearerTokenLogin = ({ onLogin, onDomainChange, domain: domainProp }) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const [ownDomain, setOwnDomain] = useState('https://example.example.com');
    const [token, setToken] = useState('');

    const effectiveDomain = domainProp ?? ownDomain;

    const handleDomainChange = (text) => {
        setOwnDomain(text);
        if (onDomainChange) onDomainChange(text);
    };

    const handleLogin = async () => {
        try {
            await onLogin(effectiveDomain, token);
        } catch {
            Alert.alert(t('mobile.token_login_failed'), t('mobile.token_login_failed_message'));
        }
    };

    return (
        <>
            {domainProp == null && (
                <TextInput
                    placeholder={t('mobile.domain')}
                    onChangeText={handleDomainChange}
                    value={ownDomain}
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                    textContentType="URL"
                    autoCapitalize="none"
                />
            )}
            <TextInput
                placeholder={t('mobile.api_token')}
                onChangeText={setToken}
                value={token}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                returnKeyType="done"
                blurOnSubmit
                secureTextEntry
            />
            <Button title={t('mobile.token_login')} onPress={handleLogin} />
        </>
    );
};

const createStyles = (colors) => StyleSheet.create({
    input: {
        height: 40,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.md,
        padding: Spacing.sm,
        width: '100%',
        color: colors.text,
        backgroundColor: colors.background,
    },
});

export default BearerTokenLogin;
