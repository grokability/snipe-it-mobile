import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, TextInput, Text, TouchableOpacity, ActivityIndicator, View, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import BrowserLoginButton from "@/components/auth/BrowserLoginButton";
import BearerTokenLogin from "@/components/auth/BearerTokenLogin";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius, Typography } from "@/constants/sizes";
import { useTranslation } from "react-i18next";
import { discoverOAuthClient, mayNeedLocalNetworkPermission } from "@/helpers/oauthClientDiscovery";
import { addLoginBreadcrumb } from "@/helpers/loginTelemetry";
import { addressGroup, describeDomain } from "@/helpers/domainShape";
import { normalizeDomain } from "@/helpers/normalizeDomain";

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

    const [domain, setDomain] = useState('');
    const [phase, setPhase] = useState(PHASE.DOMAIN);
    const [clientId, setClientId] = useState(null);
    const [showManualOAuth, setShowManualOAuth] = useState(false);
    const [manualClientId, setManualClientId] = useState('');
    // Why Continue sent no request: normalizeDomain's error code, or 'cleartext-not-local'.
    const [domainRejection, setDomainRejection] = useState(null);
    const [schemeWasAdded, setSchemeWasAdded] = useState(false);
    const checkGeneration = useRef(0);
    const discoveryCancel = useRef(null);

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
        setDomainRejection(null);
        setSchemeWasAdded(false);
    };

    // The normalized form names the same instance, so rewriting the field leaves the phase and
    // any discovery in flight alone.
    const showNormalizedDomain = (baseUrl, addedScheme) => {
        if (baseUrl === domain) return;
        setDomain(baseUrl);
        // Once rewritten the field shows https://, so this is the only record that the user
        // did not type it. Editing the field clears it.
        if (addedScheme) setSchemeWasAdded(true);
        if (onDomainChange) onDomainChange(baseUrl);
    };

    const handleDomainBlur = () => {
        const { baseUrl, addedScheme } = normalizeDomain(domain);
        if (baseUrl) showNormalizedDomain(baseUrl, addedScheme);
    };

    const isDomainBlank = domain.trim() === '';

    // Read from the field on every render, so the note is on screen before Continue is pressed:
    // pressing it is the consent, and nothing is stored.
    const domainShape = describeDomain(domain);
    const isUnencryptedLocal = domainShape.scheme === 'http' && addressGroup(domainShape) === 'local';

    const handleContinue = async () => {
        if (isDomainBlank) return;
        // The shape of what was typed is the single most useful thing to know when a login
        // fails, and it identifies nothing. See helpers/domainShape.js.
        addLoginBreadcrumb('Continue pressed', domainShape);

        const { baseUrl, addedScheme, error } = normalizeDomain(domain);
        if (error) {
            setDomainRejection(error);
            return;
        }
        // Discovery takes baseUrl directly: the state update below has not landed yet.
        showNormalizedDomain(baseUrl, addedScheme);

        // Refused on both platforms. iOS would refuse the request anyway; Android permits
        // cleartext to every host, so this is the only check there. See addressGroup.
        if (domainShape.scheme === 'http' && addressGroup(domainShape) === 'other') {
            setDomainRejection('cleartext-not-local');
            addLoginBreadcrumb('Refused http to a target outside the local network');
            return;
        }

        const generation = ++checkGeneration.current;
        discoveryCancel.current = new AbortController();
        setPhase(PHASE.CHECKING);
        const result = await discoverOAuthClient(baseUrl, {
            isCurrent: () => generation === checkGeneration.current,
            signal: discoveryCancel.current.signal,
        });
        // A cancel or an edit already moved the form on; this result belongs to an older check.
        if (generation !== checkGeneration.current) return;

        switch (result.outcome) {
            case 'oauth':
                setClientId(result.clientId);
                setPhase(PHASE.OAUTH);
                addLoginBreadcrumb('Instance supports OAuth, showing browser login');
                break;
            case 'no-oauth':
                setPhase(PHASE.BEARER);
                addLoginBreadcrumb('No OAuth client, falling back to token entry');
                break;
            case 'failure':
                setPhase(PHASE.ERROR);
                addLoginBreadcrumb('Instance unreachable, showing error state', { code: result.code });
                break;
        }
    };

    // The field is not editable while the check runs, so this is the only way out of it short of
    // the timeout. Bumping the generation discards whatever the aborted check returns.
    const handleCancelCheck = () => {
        checkGeneration.current++;
        discoveryCancel.current?.abort();
        setPhase(PHASE.DOMAIN);
    };

    return (
        <View>
            <TextInput
                placeholder={t('mobile.domain_placeholder')}
                accessibilityLabel={t('mobile.domain')}
                onChangeText={handleDomainChange}
                onBlur={handleDomainBlur}
                value={domain}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                textContentType="URL"
                autoCapitalize="none"
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                editable={phase !== PHASE.CHECKING}
            />

            {schemeWasAdded && (
                <Text style={styles.fieldNote}>{t('mobile.domain_assumed_https')}</Text>
            )}

            {isUnencryptedLocal && (
                <Text style={styles.fieldNote}>{t('mobile.unencrypted_connection_note')}</Text>
            )}

            {phase === PHASE.DOMAIN && domainRejection && (
                <Text style={styles.errorText}>
                    {domainRejection === 'cleartext-not-local'
                        ? t('mobile.cleartext_not_local_message')
                        : t('mobile.invalid_domain_message')}
                </Text>
            )}

            {phase === PHASE.DOMAIN && (
                <Button title={t('mobile.continue')} onPress={handleContinue} disabled={isDomainBlank} />
            )}

            {phase === PHASE.CHECKING && (
                <>
                    <View style={styles.checkingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.checkingText}>{t('mobile.checking_instance')}</Text>
                    </View>
                    <Button title={t('general.cancel')} onPress={() => handleCancelCheck()} />
                </>
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
                    {mayNeedLocalNetworkPermission(domain) && (
                        <Text style={styles.fieldNote}>{t('mobile.local_network_permission_hint')}</Text>
                    )}
                    {/* Only for local targets: http:// to anything else is refused before the request. */}
                    {schemeWasAdded && addressGroup(domainShape) === 'local' && (
                        <Text style={styles.fieldNote}>{t('mobile.plain_http_hint')}</Text>
                    )}
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
    fieldNote: {
        color: colors.textSecondary,
        fontSize: Typography.caption,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.md,
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
