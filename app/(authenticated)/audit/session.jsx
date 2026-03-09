import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {router} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {decode} from 'html-entities';
import {useAuditSession} from '@/context/AuditSessionProvider';
import PendingSyncs from '@/components/audit/PendingSyncs';

function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

function formatDuration(start) {
    if (!start) return null;
    const ms = Date.now() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
}

export default function AuditSessionScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const {auditedAssets, sessionStartTime, sessionCount, clearSession} = useAuditSession();

    const handleEndSession = () => {
        clearSession();
        router.back();
    };

    const handleContinueScanning = () => {
        router.push('/scanner?mode=audit');
    };

    const renderItem = ({item}) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
                <Text style={styles.itemTag}>#{item.asset_tag}</Text>
                <Text style={styles.itemName}>
                    {item.name ? decode(item.name) : item.asset_tag}
                </Text>
                {item.model && (
                    <Text style={styles.itemModel}>{decode(item.model)}</Text>
                )}
            </View>
            <Text style={styles.itemTime}>{formatTime(item.timestamp)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Summary header */}
            <View style={[styles.summaryContainer, {paddingTop: insets.top + 60}]}>
                <View style={styles.summaryRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{sessionCount}</Text>
                        <Text style={styles.statLabel}>{t('mobile.audit_session_audited')}</Text>
                    </View>
                    {sessionStartTime && (
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{formatDuration(sessionStartTime)}</Text>
                            <Text style={styles.statLabel}>{t('mobile.audit_session_duration')}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Pending syncs */}
            <PendingSyncs />

            {/* Asset list */}
            <FlashList
                data={auditedAssets}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.asset_id}-${index}`}
                estimatedItemSize={80}
                contentContainerStyle={{paddingBottom: 160}}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t('mobile.audit_session_empty')}</Text>
                    </View>
                }
            />

            {/* Action buttons */}
            <View style={[styles.buttonContainer, {paddingBottom: insets.bottom + 20}]}>
                <Pressable
                    onPress={handleContinueScanning}
                    style={({pressed}) => [styles.button, styles.continueButton, pressed && styles.buttonPressed]}
                >
                    <Text style={styles.buttonText}>{t('mobile.audit_scan')}</Text>
                </Pressable>
                {sessionCount > 0 && (
                    <Pressable
                        onPress={handleEndSession}
                        style={({pressed}) => [styles.button, styles.endButton, pressed && styles.buttonPressed]}
                    >
                        <Text style={styles.endButtonText}>{t('mobile.audit_end_session')}</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    summaryContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        backgroundColor: colors.backgroundSecondary,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statValue: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    statLabel: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
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
    itemModel: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
    itemTime: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    emptyContainer: {
        padding: Spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        backgroundColor: colors.background,
        gap: Spacing.sm,
    },
    button: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    continueButton: {
        backgroundColor: colors.primary,
    },
    endButton: {
        backgroundColor: colors.backgroundTertiary,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}],
    },
    buttonText: {
        color: '#fff',
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
    },
    endButtonText: {
        color: colors.danger,
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
    },
});
