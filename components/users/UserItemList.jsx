import { View, Text, StyleSheet, RefreshControl, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useState, useCallback, useMemo, useLayoutEffect } from "react";
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
import { AssetListSkeleton } from "@/components/ui/Skeleton";
import { useRedirectIfDenied } from "@/permissions/PermissionContext";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

const PAGE_SIZE = 25;

// itemKey is the nested item on a checkout row. Newer servers return one row per checkout, with the item in
// row[itemKey]; older servers return the items themselves, with no checkout date or note.
const ITEM_TYPES = {
    accessories: {
        itemKey: 'accessory',
        permissionKey: PERMISSIONS.ACCESSORIES_VIEW,
        icon: 'headset-outline',
        label: 'general.accessories',
        title: 'mobile.user_accessories',
        empty: 'mobile.user_has_no_accessories_assigned',
        route: (itemId) => `/accessories/${itemId}`,
    },
    consumables: {
        itemKey: 'consumable',
        permissionKey: PERMISSIONS.CONSUMABLES_VIEW,
        icon: 'cube-outline',
        label: 'general.consumables',
        title: 'mobile.user_consumables',
        empty: 'mobile.user_has_no_consumables_assigned',
        route: (itemId) => `/consumables/${itemId}`,
    },
    // No license screen yet, so license rows don't open anything
    licenses: {
        itemKey: 'license',
        permissionKey: PERMISSIONS.LICENSES_VIEW,
        icon: 'key-outline',
        label: 'general.licenses',
        title: 'mobile.user_licenses',
        empty: 'mobile.user_has_no_licenses_assigned',
        route: null,
    },
};

// The accessories, consumables or licenses checked out to one user, as the web user page's tabs list them
export default function UserItemList({ userId, itemType }) {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const navigation = useNavigation();

    const config = ITEM_TYPES[itemType];
    useRedirectIfDenied(config.permissionKey);

    // Same query as the User screen, so coming from there the name is already cached
    const userQuery = useQuery({
        queryKey: userKeys.detail(userId),
        queryFn: () => makeRequest({ url: `/users/${userId}`, method: 'get', permissionKey: PERMISSIONS.USERS_VIEW }),
    });

    const firstName = userQuery.data?.first_name || userQuery.data?.name;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: firstName ? t(config.title, { firstName: decode(firstName) }) : t(config.label),
        });
    }, [navigation, firstName, config, t]);

    const queryKey = userKeys.items(userId, itemType);

    const itemsQuery = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => makeRequest({
            url: `/users/${userId}/${itemType}?limit=${PAGE_SIZE}&offset=${pageParam}`,
            method: 'get',
            permissionKey: config.permissionKey,
        }),
        initialPageParam: 0,
        // Older servers ignore limit and return every row at once, with total matching
        getNextPageParam: (lastPage, allPages) => {
            const fetchedCount = allPages.reduce((count, page) => count + (page?.rows?.length ?? 0), 0);

            if (!lastPage?.rows?.length || fetchedCount >= lastPage.total) {
                return undefined;
            }

            return fetchedCount;
        },
    });

    useRefreshOnFocus(queryKey);

    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const onManualRefresh = async () => {
        setIsManualRefreshing(true);
        await itemsQuery.refetch();
        setIsManualRefreshing(false);
    };

    const data = useMemo(
        () => itemsQuery.data?.pages.flatMap((page) => page.rows ?? []) ?? [],
        [itemsQuery.data]
    );

    const loadMore = useCallback(() => {
        if (itemsQuery.hasNextPage && !itemsQuery.isFetchingNextPage) {
            itemsQuery.fetchNextPage();
        }
    }, [itemsQuery]);

    const Item = ({ row }) => {
        const checkoutItem = row[config.itemKey];
        const itemId = checkoutItem?.id ?? row.id;
        const route = config.route ? config.route(itemId) : null;

        return (
            <Pressable
                onPress={route ? () => router.push(route) : undefined}
                disabled={!route}
                style={({ pressed }) => [
                    styles.itemContainer,
                    pressed && styles.itemPressed,
                ]}
            >
                <View style={styles.imageContainer}>
                    {row.image
                        ? <Image style={styles.image} source={{ uri: row.image }} transition={200} cachePolicy="memory-disk" />
                        : <Ionicons name={config.icon} size={40} color={colors.textSecondary} />
                    }
                </View>
                <View style={styles.contentContainer}>
                    <Text style={styles.itemName}>{decode(row.name)}</Text>
                    {checkoutItem && row.created_at?.formatted && (
                        <Text style={styles.metaText}>
                            {t('general.checkout_date')}: {row.created_at.formatted}
                        </Text>
                    )}
                    {checkoutItem && row.note && (
                        <Text style={styles.noteText}>{decode(row.note)}</Text>
                    )}
                </View>
            </Pressable>
        );
    };

    if (itemsQuery.isPending) {
        return <AssetListSkeleton />;
    }

    if (itemsQuery.isError) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState onRetry={() => itemsQuery.refetch()} />
            </SafeAreaProvider>
        );
    }

    if (data.length === 0) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    icon="file-tray-outline"
                    title={t(config.empty)}
                    message={null}
                    onRetry={() => itemsQuery.refetch()}
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
                renderItem={({ item }) => <Item row={item} />}
                // Older servers repeat the item's id when the user has two of it, such as two seats of one license
                keyExtractor={(item, index) => `${item.id}-${index}`}
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
        flexDirection: 'column',
        gap: 5,
        backgroundColor: colors.background,
    },
    itemContainer: {
        width: '100%',
        padding: Spacing.lg,
        marginVertical: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
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
    imageContainer: {
        width: '25%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.sm,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.sm,
    },
    contentContainer: {
        flex: 1,
        gap: 6,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    metaText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    noteText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
});
