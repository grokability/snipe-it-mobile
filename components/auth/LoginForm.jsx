import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity, ActivityIndicator, View, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import BrowserLoginButton from "@/components/auth/BrowserLoginButton";
import BearerTokenLogin from "@/components/auth/BearerTokenLogin";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius, Typography } from "@/constants/sizes";
import { useTranslation } from "react-i18next";
import { discoverOAuthClient } from "@/helpers/oauthClientDiscovery";

const PHASE = {
    DOMAIN: 'domain',
    CHECKING: 'checking',
    OAUTH: 'oauth',
    BEARER: 'bearer',
    ERROR: 'error',
};

const LoginForm = ({ onBearerLogin, onDomainChange }) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [domain, setDomain] = useState('https://example.example.com');
    const [phase, setPhase] = useState(PHASE.DOMAIN);
    const [clientId, setClientId] = useState(null);
    const [showManualOAuth, setShowManualOAuth] = useState(false);
    const [manualClientId, setManualClientId] = useState('');
    const checkGeneration = useRef(0);

    useEffect(() => {
        SecureStore.getItemAsync('domain').then(saved => {
            if (saved) {
                setDomain(saved);
                if (onDomainChange) onDomainChange(saved);
            }
        });
    }, []);

    useEffect(() => {
        if (showManualOAuth && domain) {
            const domainAuthConfigKey = `manual_oauth_client_${domain.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            SecureStore.getItemAsync(domainAuthConfigKey).then(saved => {
                if (saved) setManualClientId(saved);
            });
        }
    }, [showManualOAuth]);

    useEffect(() => {
        if (manualClientId && domain) {
            const domainAuthConfigKey = `manual_oauth_client_${domain.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            SecureStore.setItemAsync(domainAuthConfigKey, manualClientId).catch(() => {});
        }
    }, [manualClientId]);

    const handleDomainChange = (text) => {
        setDomain(text);
        if (onDomainChange) onDomainChange(text);
        checkGeneration.current++;
        setPhase(PHASE.DOMAIN);
        setClientId(null);
        setShowManualOAuth(false);
        setManualClientId('');
    };

    const handleContinue = async () => {
        const generation = ++checkGeneration.current;
        setPhase(PHASE.CHECKING);
        try {
            const result = await discoverOAuthClient(domain);
            if (generation !== checkGeneration.current) return;
            if (result) {
                setClientId(result.clientId);
                setPhase(PHASE.OAUTH);
            } else {
                setPhase(PHASE.BEARER);
            }
        } catch {
            if (generation !== checkGeneration.current) return;
            setPhase(PHASE.ERROR);
        }
    };

    return (
        <View>
            <TextInput
                placeholder={t('mobile.domain')}
                onChangeText={handleDomainChange}
                value={domain}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                textContentType="URL"
                autoCapitalize="none"
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                editable={phase !== PHASE.CHECKING}
            />

            {phase === PHASE.DOMAIN && (
                <Button title={t('mobile.continue')} onPress={handleContinue} />
            )}

            {phase === PHASE.CHECKING && (
                <View style={styles.checkingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.checkingText}>{t('mobile.checking_instance')}</Text>
                </View>
            )}

            {phase === PHASE.OAUTH && (
                <BrowserLoginButton domain={domain} clientId={clientId} />
            )}

            {phase === PHASE.BEARER && (
                <>
                    <Text style={styles.noOAuthText}>{t('mobile.oauth_not_supported')}</Text>
                    <BearerTokenLogin onLogin={onBearerLogin} domain={domain} />
                    <TouchableOpacity
                        onPress={() => setShowManualOAuth(prev => !prev)}
                        style={styles.tryOAuthLink}
                    >
                        <Text style={styles.tryOAuthText}>{t('mobile.try_oauth_anyway')}</Text>
                    </TouchableOpacity>
                    {showManualOAuth && (
                        <>
                            <TextInput
                                placeholder={t('mobile.enter_client_id')}
                                onChangeText={setManualClientId}
                                value={manualClientId}
                                style={styles.input}
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                                returnKeyType="done"
                                submitBehavior="blurAndSubmit"
                                autoCapitalize="none"
                            />
                            {manualClientId.length > 0 && (
                                <BrowserLoginButton domain={domain} clientId={manualClientId} />
                            )}
                        </>
                    )}
                </>
            )}

            {phase === PHASE.ERROR && (
                <>
                    <Text style={styles.errorText}>{t('mobile.connection_error_message')}</Text>
                    <Button title={t('mobile.retry')} onPress={() => setPhase(PHASE.DOMAIN)} />
                </>
            )}
        </View>
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
    checkingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    checkingText: {
        color: colors.textSecondary,
        fontSize: Typography.body,
    },
    noOAuthText: {
        color: colors.textSecondary,
        fontSize: Typography.caption,
        marginBottom: Spacing.md,
    },
    tryOAuthLink: {
        marginTop: Spacing.md,
        alignSelf: 'center',
    },
    tryOAuthText: {
        color: colors.primary,
        fontSize: Typography.caption,
    },
    errorText: {
        color: colors.danger,
        fontSize: Typography.body,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
});

export default LoginForm;
