import { View, Text, StyleSheet, RefreshControl, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useState, useCallback, useMemo, useLayoutEffect, useRef, useEffect } from "react";
import debounce from 'lodash/debounce';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius, Typography, FontWeight } from "@/constants/sizes";
import { decode } from "html-entities";
import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { Ionicons } from '@expo/vector-icons';
import EmptyState from "@/components/ui/EmptyState";
import { UserListSkeleton } from "@/components/ui/Skeleton";
import { useRedirectIfDenied } from "@/permissions/PermissionContext";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

const PAGE_SIZE = 25;
const AVATAR_SIZE = 64;

const buildQuery = ({ offset = 0, search = '' }) => {
    let query = `limit=${PAGE_SIZE}&offset=${offset}&sort=first_name&order=asc`;

    if (search) {
        query += `&search=${encodeURIComponent(search)}`;
    }

    return query;
};

export default function UsersScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const navigation = useNavigation();

    useRedirectIfDenied(PERMISSIONS.USERS_VIEW);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchBarRef = useRef(null);

    const debouncedSetSearch = useMemo(
        () => debounce((value) => setDebouncedSearch(value), 300),
        []
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerSearchBarOptions: {
                ref: searchBarRef,
                placeholder: t('general.search'),
                hideWhenScrolling: false,
                tintColor: colors.primary,
                autoCapitalize: 'none',
                onChangeText: (e) => {
                    debouncedSetSearch(e.nativeEvent.text);
                },
                onCancelButtonPress: () => {
                    debouncedSetSearch.cancel();
                    setDebouncedSearch('');
                },
            },
        });
    }, [navigation, colors.primary, t, debouncedSetSearch]);

    // cancel any pending debounce on unmount so we don't update state after user navigates away
    useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

    const queryKey = userKeys.list({ search: debouncedSearch });

    const usersQuery = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => makeRequest({
            url: `/users?${buildQuery({ offset: pageParam, search: debouncedSearch })}`,
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

    const Item = ({ user }) => {
        const placeDetails = [user.department?.name, user.location?.name]
            .filter((placeName) => Boolean(placeName))
            .map((placeName) => decode(placeName))
            .join(' · ');

        return (
            <Pressable
                onPress={() => router.push(`/(more)/users/${user.id}`)}
                style={({ pressed }) => [
                    styles.itemContainer,
                    pressed && styles.itemPressed
                ]}
            >
                {user.avatar
                    ? (
                        <Image
                            style={styles.avatar}
                            source={{ uri: user.avatar }}
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    )
                    : <Ionicons name="person-circle-outline" size={AVATAR_SIZE} color={colors.textSecondary} />
                }
                <View style={styles.contentContainer}>
                    <Text style={styles.userName}>{decode(user.name)}</Text>
                    {Boolean(user.jobtitle) && (
                        <Text style={styles.jobTitle}>{decode(user.jobtitle)}</Text>
                    )}
                    {Boolean(user.username || user.email) && (
                        <Text style={styles.metaText}>{decode(user.username || user.email)}</Text>
                    )}
                    {placeDetails !== '' && (
                        <Text style={styles.metaText}>{placeDetails}</Text>
                    )}
                    <View style={styles.footer}>
                        <Text style={styles.assetsCount}>{t('general.countable.assets', { count: user.assets_count })}</Text>
                        {user.vip && (
                            <View style={[styles.badge, styles.vipBadge]}>
                                <Text style={[styles.badgeText, styles.vipBadgeText]}>{t('admin.users.general.vip_label')}</Text>
                            </View>
                        )}
                        {!user.activated && (
                            <View style={[styles.badge, styles.loginDisabledBadge]}>
                                <Text style={[styles.badgeText, styles.loginDisabledBadgeText]}>{t('general.login_disabled')}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    if (usersQuery.isPending) {
        return <UserListSkeleton />;
    }

    if (data.length === 0 && !debouncedSearch) {
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

    if (data.length === 0) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    title={t('table.no_matching_records')}
                    message={t('mobile.search_no_results_message')}
                    onRetry={() => {
                        debouncedSetSearch.cancel();
                        setDebouncedSearch('');
                        searchBarRef.current?.clearText();
                    }}
                    retryLabel={t('mobile.clear_search')}
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
                renderItem={({ item }) => <Item user={item} />}
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    itemPressed: {
        backgroundColor: colors.backgroundSecondary,
        transform: [{ scale: 0.995 }],
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: colors.backgroundSecondary,
    },
    contentContainer: {
        flex: 1,
        gap: 4,
    },
    userName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    jobTitle: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    metaText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 2,
    },
    assetsCount: {
        fontSize: Typography.caption,
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    badgeText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
    },
    vipBadge: {
        backgroundColor: colors.primary + '20',
    },
    vipBadgeText: {
        color: colors.primary,
    },
    loginDisabledBadge: {
        backgroundColor: colors.danger + '20',
    },
    loginDisabledBadgeText: {
        color: colors.danger,
    },
});
