import { Text, StyleSheet, RefreshControl, Platform } from 'react-native';
import { useState, useCallback, useMemo } from "react";
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius, Typography, FontWeight } from "@/constants/sizes";
import { decode } from "html-entities";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/ui/EmptyState";
import { UserListSkeleton } from "@/components/ui/Skeleton";
import { useRedirectIfDenied } from "@/permissions/PermissionContext";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

const PAGE_SIZE = 25;

const buildQuery = ({ offset = 0 }) => `limit=${PAGE_SIZE}&offset=${offset}&sort=first_name&order=asc`;

export default function UsersScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    useRedirectIfDenied(PERMISSIONS.USERS_VIEW);

    const queryKey = userKeys.list({});

    const usersQuery = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => makeRequest({
            url: `/users?${buildQuery({ offset: pageParam })}`,
            method: 'get',
            permissionKey: PERMISSIONS.USERS_VIEW,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => (
            lastPage?.rows?.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined
        ),
        placeholderData: keepPreviousData,
    });

    useRefreshOnFocus(queryKey);

    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const onManualRefresh = async () => {
        setIsManualRefreshing(true);
        await usersQuery.refetch();
        setIsManualRefreshing(false);
    };

    const data = useMemo(
        () => usersQuery.data?.pages.flatMap(page => page.rows ?? []) ?? [],
        [usersQuery.data]
    );

    const loadMore = useCallback(() => {
        if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) {
            usersQuery.fetchNextPage();
        }
    }, [usersQuery]);

    if (usersQuery.isPending) {
        return <UserListSkeleton />;
    }

    if (data.length === 0) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    icon="people-outline"
                    title={t('mobile.no_results')}
                    message={t('mobile.no_results_message')}
                    onRetry={() => usersQuery.refetch()}
                />
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <FlashList
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{
                    paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0,
                    paddingBottom: 80
                }}
                style={styles.flatlist}
                data={data}
                renderItem={({ item }) => <Text style={styles.itemContainer}>{decode(item.name)}</Text>}
                keyExtractor={item => item.id}
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
    flatlist: {
        flex: 1,
        padding: 5,
        backgroundColor: colors.background,
    },
    itemContainer: {
        width: '100%',
        padding: Spacing.lg,
        marginVertical: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
});
