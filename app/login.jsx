import React, {useContext, useState, useMemo} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { AuthContext } from '@/context/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import BearerTokenLogin from '@/components/auth/BearerTokenLogin';
import {Section} from '@/components/ui/Section';
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, Typography, FontWeight, BorderRadius} from "@/constants/sizes";
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
            <View style={styles.content}>
                <LottieView
                    source={require('@/assets/spinning_star_eye.json')}
                    style={styles.lottie}
                    autoPlay
                    loop
                />
                <Text style={styles.title}>{t('mobile.login_title')}</Text>
                <View style={styles.formCard}>
                    <LoginForm onLogin={oAuthLogin} onDomainChange={handleDomainChange} />
                </View>

                <View style={styles.advancedSection}>
                    <Section title={t('mobile.advanced_options')} collapsible defaultCollapsed compact>
                        <BearerTokenLogin onLogin={bearerLogin} onDomainChange={handleDomainChange} />
                    </Section>
                </View>
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
    content: {
        width: '100%',
        maxWidth: 460,
        alignItems: 'center',
    },
    lottie: {
        width: 100,
        height: 100,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xl,
        color: colors.text,
    },
    formCard: {
        width: '100%',
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.lg,
    },
    advancedSection: {
        width: '100%',
        marginTop: Spacing.lg,
    },
});