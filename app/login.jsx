import React, {useContext, useState, useMemo} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AuthContext } from '@/context/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import BearerTokenLogin from '@/components/auth/BearerTokenLogin';
import {Section} from '@/components/ui/Section';
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

export default function LoginScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { oAuthLogin, bearerLogin } = useContext(AuthContext);
    const [domain, setDomain] = useState('https://example.example.com');

    const handleDomainChange = (newDomain) => {
        setDomain(newDomain);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('mobile.login_title')}</Text>
            <LoginForm onLogin={oAuthLogin} onDomainChange={handleDomainChange} />

            <View style={styles.advancedSection}>
                <Section title={t('mobile.advanced_options')} collapsible defaultCollapsed>
                    <BearerTokenLogin onLogin={bearerLogin} onDomainChange={handleDomainChange} />
                </Section>
            </View>
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
    title: {
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xl,
        color: colors.text,
    },
    advancedSection: {
        width: '100%',
        marginTop: Spacing.lg,
    },
});