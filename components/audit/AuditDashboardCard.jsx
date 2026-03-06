import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect} from 'expo-router';
import {makeRequest} from '@/helpers/axiosConfig';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import {Section} from '@/components/ui/Section';

export default function AuditDashboardCard() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    const [dueCount, setDueCount] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            makeRequest({url: '/hardware/audits/due', method: 'GET'})
                .then((res) => setDueCount(res.total || 0))
                .catch(() => {});
            makeRequest({url: '/hardware/audits/overdue', method: 'GET'})
                .then((res) => setOverdueCount(res.total || 0))
                .catch(() => {});
        }, [])
    );

    return (
        <Section title={t('general.audit')}>
            <View style={styles.badgeRow}>
                <Pressable
                    onPress={() => router.push('/(authenticated)/audit/')}
                    style={({pressed}) => [styles.badge, styles.badgeDue, pressed && styles.badgePressed]}
                >
                    <Text style={styles.badgeCount}>{dueCount}</Text>
                    <Text style={styles.badgeLabel} numberOfLines={1}>{t('general.audit_due')}</Text>
                </Pressable>
                <Pressable
                    onPress={() => router.push('/(authenticated)/audit/')}
                    style={({pressed}) => [styles.badge, styles.badgeOverdue, pressed && styles.badgePressed]}
                >
                    <Text style={styles.badgeCount}>{overdueCount}</Text>
                    <Text style={styles.badgeLabel} numberOfLines={1}>{t('general.audit_overdue')}</Text>
                </Pressable>
            </View>

            <Pressable
                onPress={() => router.push('/scanner?mode=audit')}
                style={({pressed}) => [styles.scanButton, pressed && styles.scanButtonPressed]}
            >
                <Text style={styles.scanButtonText}>{t('mobile.audit_scan')}</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/(authenticated)/audit/')}>
                <Text style={styles.viewLink}>{t('mobile.screen_audit_dashboard')}</Text>
            </Pressable>
        </Section>
    );
}

const createStyles = (colors) => StyleSheet.create({
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    badge: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    badgeDue: {
        backgroundColor: colors.warning + '20',
    },
    badgeOverdue: {
        backgroundColor: colors.danger + '20',
    },
    badgePressed: {
        opacity: 0.7,
    },
    badgeCount: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    badgeLabel: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
        color: colors.textSecondary,
    },
    scanButton: {
        backgroundColor: colors.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
    },
    scanButtonPressed: {
        opacity: 0.8,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
    },
    viewLink: {
        fontSize: Typography.body,
        color: colors.primary,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
    },
});
