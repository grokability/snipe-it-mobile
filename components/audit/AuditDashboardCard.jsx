import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect} from 'expo-router';
import {makeRequest} from '@/helpers/axiosConfig';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import {Section} from '@/components/ui/Section';
import {cacheAssets} from '@/helpers/db/cacheManager';
import {getPendingCount} from '@/helpers/db/syncManager';
import * as Burnt from 'burnt';

export default function AuditDashboardCard() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    const [dueCount, setDueCount] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [downloading, setDownloading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            makeRequest({url: '/hardware/audits/due', method: 'GET'})
                .then((res) => setDueCount(res.total || 0))
                .catch(() => {});
            makeRequest({url: '/hardware/audits/overdue', method: 'GET'})
                .then((res) => setOverdueCount(res.total || 0))
                .catch(() => {});
            getPendingCount().then(setPendingCount).catch(() => {});
        }, [])
    );

    const handleDownloadForOffline = useCallback(async () => {
        setDownloading(true);
        try {
            const [dueRes, overdueRes] = await Promise.all([
                makeRequest({url: '/hardware/audits/due?limit=500&sort=next_audit_date&order=asc', method: 'GET'}),
                makeRequest({url: '/hardware/audits/overdue?limit=500&sort=next_audit_date&order=asc', method: 'GET'}),
            ]);
            const dueRows = dueRes.rows || [];
            const overdueRows = overdueRes.rows || [];
            await Promise.all([
                dueRows.length > 0 ? cacheAssets(dueRows, 'audit_due') : Promise.resolve(),
                overdueRows.length > 0 ? cacheAssets(overdueRows, 'audit_overdue') : Promise.resolve(),
            ]);
            const total = dueRows.length + overdueRows.length;
            Burnt.alert({
                title: t('mobile.download_complete', {count: total}),
                preset: 'done',
                duration: 2,
            });
        } catch (err) {
            console.error('Download for offline failed:', err);
            Burnt.alert({
                title: t('general.error'),
                preset: 'error',
                message: t('mobile.audit_failed'),
                duration: 3,
            });
        } finally {
            setDownloading(false);
        }
    }, [t]);

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

            <Pressable
                onPress={handleDownloadForOffline}
                disabled={downloading}
                style={({pressed}) => [styles.downloadButton, pressed && styles.scanButtonPressed, downloading && styles.downloadButtonDisabled]}
            >
                {downloading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Text style={styles.downloadButtonText}>{t('mobile.download_for_offline')}</Text>
                )}
            </Pressable>

            {pendingCount > 0 && (
                <Text style={styles.pendingText}>
                    {t('mobile.pending_syncs', {count: pendingCount})}
                </Text>
            )}

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
    downloadButton: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary + '40',
    },
    downloadButtonDisabled: {
        opacity: 0.6,
    },
    downloadButtonText: {
        color: colors.primary,
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
    },
    pendingText: {
        fontSize: Typography.caption,
        color: colors.warning,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
    },
    viewLink: {
        fontSize: Typography.body,
        color: colors.primary,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
    },
});
