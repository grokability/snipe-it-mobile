import {View, Text, StyleSheet, RefreshControl, Platform, Pressable} from 'react-native';
import {useState, useCallback, useMemo} from 'react';
import {router} from 'expo-router';
import {useInfiniteQuery} from '@tanstack/react-query';
import {decode} from 'html-entities';
import {makeRequest} from '@/helpers/axiosConfig';
import {actionLogKeys} from '@/helpers/queryKeys';
import {useRefreshOnFocus} from '@/hooks/useRefreshOnFocus';
import {PERMISSIONS} from '@/permissions/PermissionKeys';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FlashList} from '@shopify/flash-list';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import EmptyState from '@/components/ui/EmptyState';
import {formatActionDate, getActionBadgeColor} from '@/helpers/utils';

const PAGE_SIZE = 25;

const ActionRow = ({actionLog, colors, styles}) => {
    const badgeColor = getActionBadgeColor(colors, actionLog.action_type);
    const itemName = decode(actionLog.item?.name ?? actionLog.action_type);
    const subtitleParts = [];
    if (actionLog.item?.type) subtitleParts.push(decode(actionLog.item.type));
    if (actionLog.created_by?.name) subtitleParts.push(decode(actionLog.created_by.name));
    const subtitle = subtitleParts.join(' · ');

    return (
        <Pressable
            style={({pressed}) => [styles.itemContainer, pressed && styles.itemPressed]}
            onPress={() => router.push({
                pathname: `/(more)/reports/activity-report/${actionLog.id}`,
                params: {data: JSON.stringify(actionLog)},
            })}
        >
            <View style={[styles.badge, {backgroundColor: badgeColor + '22', borderColor: badgeColor + '55'}]}>
                <Text style={[styles.badgeText, {color: badgeColor}]} numberOfLines={1}>
                    {actionLog.action_type}
                </Text>
            </View>
            <View style={styles.rowContent}>
                <Text style={styles.rowPrimary} numberOfLines={1}>{itemName}</Text>
                {subtitle ? (
                    <Text style={styles.rowMeta} numberOfLines={1}>{subtitle}</Text>
                ) : null}
            </View>
            <Text style={styles.rowDate} numberOfLines={1}>{formatActionDate(actionLog.action_date)}</Text>
            <FontAwesome name="chevron-right" size={12} color={colors.textSecondary} />
        </Pressable>
    );
};

export default function ActivityReportScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const insets = useSafeAreaInsets();

    const queryKey = actionLogKeys.list({});

    const activityReportQuery = useInfiniteQuery({
        queryKey,
        queryFn: ({pageParam}) => makeRequest({
            url: `/reports/activity?limit=${PAGE_SIZE}&offset=${pageParam}&sort=created_at&order=desc`,
            method: 'get',
            permissionKey: PERMISSIONS.REPORTS_VIEW,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => (
            lastPage?.rows?.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined
        ),
    });

    useRefreshOnFocus(queryKey);

    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const onManualRefresh = async () => {
        setIsManualRefreshing(true);
        await activityReportQuery.refetch();
        setIsManualRefreshing(false);
    };

    const actionLogs = useMemo(
        () => activityReportQuery.data?.pages.flatMap(page => page.rows ?? []) ?? [],
        [activityReportQuery.data]
    );

    const loadMore = useCallback(() => {
        if (activityReportQuery.hasNextPage && !activityReportQuery.isFetchingNextPage) {
            activityReportQuery.fetchNextPage();
        }
    }, [activityReportQuery]);

    if (!activityReportQuery.isPending && actionLogs.length === 0) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    icon="file-tray-outline"
                    title={t('mobile.no_results')}
                    message={t('mobile.no_results_message')}
                    onRetry={() => activityReportQuery.refetch()}
                />
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <FlashList
                data={actionLogs}
                renderItem={({item}) => (
                    <ActionRow actionLog={item} colors={colors} styles={styles} />
                )}
                keyExtractor={item => String(item.id)}
                estimatedItemSize={64}
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{
                    paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0,
                    paddingBottom: 80,
                }}
                refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={onManualRefresh} />}
            />
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        backgroundColor: colors.backgroundSecondary,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemPressed: {
        backgroundColor: colors.backgroundTertiary,
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
        width: 72,
        textAlign: 'right',
    },
});
