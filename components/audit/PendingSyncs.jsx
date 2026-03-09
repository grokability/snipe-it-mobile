import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, BorderRadius, Typography, FontWeight } from '@/constants/sizes';
import { useTranslation } from 'react-i18next';
import { getPendingAudits, deleteQueueItem, retryFailedAudit } from '@/helpers/db/syncManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function PendingSyncs({ onCountChange }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { isConnected, trySync } = useNetworkStatus();
    const [items, setItems] = useState([]);

    const loadItems = useCallback(async () => {
        const pending = await getPendingAudits();
        setItems(pending);
        onCountChange?.(pending.length);
    }, [onCountChange]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const handleRetry = useCallback(async (id) => {
        await retryFailedAudit(id);
        if (isConnected) {
            await trySync();
        }
        loadItems();
    }, [isConnected, trySync, loadItems]);

    const handleDelete = useCallback(async (id) => {
        await deleteQueueItem(id);
        loadItems();
    }, [loadItems]);

    if (items.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {t('mobile.pending_syncs', { count: items.length })}
            </Text>
            {items.map((item) => (
                <View key={item.id} style={styles.item}>
                    <View style={styles.itemContent}>
                        <Text style={styles.itemTag}>#{item.asset_tag}</Text>
                        {item.asset_name && (
                            <Text style={styles.itemName}>{item.asset_name}</Text>
                        )}
                        <View style={styles.statusRow}>
                            <View style={[
                                styles.statusBadge,
                                item.status === 'failed' ? styles.statusFailed : styles.statusPending,
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    item.status === 'failed' ? styles.statusTextFailed : styles.statusTextPending,
                                ]}>
                                    {item.status === 'failed' ? t('mobile.sync_failed') : t('mobile.sync_pending')}
                                </Text>
                            </View>
                            {item.attempts > 0 && (
                                <Text style={styles.attemptsText}>
                                    {t('mobile.sync_attempts', { count: item.attempts })}
                                </Text>
                            )}
                        </View>
                        {item.last_error && (
                            <Text style={styles.errorText}>{item.last_error}</Text>
                        )}
                    </View>
                    <View style={styles.actions}>
                        {item.status === 'failed' && (
                            <Pressable onPress={() => handleRetry(item.id)} style={styles.actionButton}>
                                <Text style={styles.retryText}>{t('mobile.retry')}</Text>
                            </Pressable>
                        )}
                        <Pressable onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                            <Text style={styles.deleteText}>{t('general.delete')}</Text>
                        </Pressable>
                    </View>
                </View>
            ))}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    title: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
        marginBottom: Spacing.xs,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
    },
    itemContent: {
        flex: 1,
        gap: 2,
    },
    itemTag: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    itemName: {
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.xs,
    },
    statusPending: {
        backgroundColor: colors.warning + '20',
    },
    statusFailed: {
        backgroundColor: colors.danger + '20',
    },
    statusText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
    },
    statusTextPending: {
        color: colors.warning,
    },
    statusTextFailed: {
        color: colors.danger,
    },
    attemptsText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
    errorText: {
        fontSize: Typography.caption,
        color: colors.danger,
        marginTop: 2,
    },
    actions: {
        gap: Spacing.sm,
        alignItems: 'flex-end',
    },
    actionButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    retryText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
        color: colors.primary,
    },
    deleteText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
        color: colors.danger,
    },
});
