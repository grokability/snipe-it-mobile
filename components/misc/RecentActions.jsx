import React, {useMemo} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from "react-native";
import {decode} from 'html-entities';
import {useQuery} from '@tanstack/react-query';
import {makeRequest} from "@/helpers/axiosConfig";
import {actionLogKeys} from "@/helpers/queryKeys";
import {useRefreshOnFocus} from "@/hooks/useRefreshOnFocus";
import {router} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight, Spacing, BorderRadius} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {usePermission} from "@/permissions/PermissionContext";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {formatActionDate, getActionBadgeColor} from "@/helpers/utils";

const ActionRow = ({actionLog, colors, styles, isLast}) => {
    const badgeColor = getActionBadgeColor(colors, actionLog.action_type);
    const assetName = decode(actionLog.item?.name ?? actionLog.action_type);
    const subtitleParts = [];
    if (actionLog.item?.type) subtitleParts.push(decode(actionLog.item.type));
    if (actionLog.created_by?.name) subtitleParts.push(decode(actionLog.created_by.name));
    const subtitle = subtitleParts.join(' · ');

    return (
        <Pressable
            onPress={() => router.push({
            pathname: `/(more)/reports/activity-report/${actionLog.id}`,
            params: {data: JSON.stringify(actionLog)},
        })}
            style={[styles.row, !isLast && styles.rowDivider]}
        >
            <View style={[styles.badge, {backgroundColor: badgeColor + '22', borderColor: badgeColor + '55'}]}>
                <Text style={[styles.badgeText, {color: badgeColor}]} numberOfLines={1}>
                    {actionLog.action_type}
                </Text>
            </View>
            <View style={styles.rowContent}>
                <Text style={styles.rowPrimary} numberOfLines={1}>{assetName}</Text>
                {subtitle ? (
                    <Text style={styles.rowMeta} numberOfLines={1}>{subtitle}</Text>
                ) : null}
            </View>
            <Text style={styles.rowDate} numberOfLines={1}>{formatActionDate(actionLog.action_date)}</Text>
        </Pressable>
    );
};

const RecentActions = () => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const { denied: reportsViewDenied } = usePermission(PERMISSIONS.REPORTS_VIEW);

    const actionLogsQuery = useQuery({
        queryKey: actionLogKeys.recent(),
        queryFn: () => makeRequest({
            url: '/reports/activity?limit=5&offset=0&sort=created_at&order=desc',
            method: 'get',
            permissionKey: PERMISSIONS.REPORTS_VIEW,
            silent: true,
        }),
        enabled: !reportsViewDenied,
    });

    useRefreshOnFocus(actionLogKeys.recent());

    const actionLogs = actionLogsQuery.data?.rows ?? [];

    if (reportsViewDenied) return null;
    if (actionLogsQuery.isSuccess && actionLogs.length === 0) return null;

    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>{t('general.recent_activity')}</Text>
                <Pressable onPress={() => router.push('/(more)/reports/activity-report')}>
                    <Text style={styles.showMore}>{t('mobile.show_more')}</Text>
                </Pressable>
            </View>
            <View style={styles.card}>
                {actionLogsQuery.isPending ? (
                    <ActivityIndicator
                        color={colors.primary}
                        style={styles.spinner}
                    />
                ) : actionLogsQuery.isError ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{t('table.load_error_title')}</Text>
                        <Pressable onPress={() => actionLogsQuery.refetch()} hitSlop={8}>
                            <Text style={styles.retryText}>{t('mobile.retry')}</Text>
                        </Pressable>
                    </View>
                ) : actionLogs.map((actionLog, index) => (
                    <ActionRow
                        key={actionLog.id}
                        actionLog={actionLog}
                        colors={colors}
                        styles={styles}
                        isLast={index === actionLogs.length - 1}
                    />
                ))}
            </View>
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    showMore: {
        fontSize: Typography.caption,
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
    card: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    badge: {
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        width: 96,
    },
    badgeText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
    },
    rowContent: {
        flex: 1,
        minWidth: 0,
    },
    rowPrimary: {
        fontSize: Typography.body,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    rowMeta: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        marginTop: 1,
    },
    rowDate: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        width: 88,
        textAlign: 'right',
    },
    spinner: {
        paddingVertical: Spacing.xl,
    },
    errorContainer: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    errorText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    retryText: {
        fontSize: Typography.caption,
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
});

export default RecentActions;
