import { View, Text, StyleSheet, Image, RefreshControl, Pressable, Platform, ScrollView } from 'react-native';
import { useState, useCallback, useMemo, useLayoutEffect, useRef, useEffect } from "react";
import debounce from 'lodash/debounce';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { makeRequest } from "@/helpers/axiosConfig";
import { assetKeys } from "@/helpers/queryKeys";
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
import FilterChip from "@/components/ui/FilterChip";
import AssetFilterBottomSheet from "@/components/bottomSheets/AssetFilterBottomSheet";
import {usePermission, useRedirectIfDenied} from "@/permissions/PermissionContext";
import {PERMISSIONS} from "@/permissions/PermissionKeys";

const EMPTY_FILTERS = {
    status: null,
    category: null,
    manufacturer: null,
    supplier: null,
    location: null,
    company: null,
    model: null,
};

const PAGE_SIZE = 25;

const buildQuery = ({ offset = 0, search = '', filters = EMPTY_FILTERS }) => {
    let query = `limit=${PAGE_SIZE}&offset=${offset}&sort=created_at&order=asc`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (filters.status) query += `&status_id=${filters.status.id}`;
    if (filters.category) query += `&category_id=${filters.category.id}`;
    if (filters.manufacturer) query += `&manufacturer_id=${filters.manufacturer.id}`;
    if (filters.supplier) query += `&supplier_id=${filters.supplier.id}`;
    if (filters.location) query += `&location_id=${filters.location.id}`;
    if (filters.company) query += `&company_id=${filters.company.id}`;
    if (filters.model) query += `&model_id=${filters.model.id}`;
    return query;
};

export default function AssetsScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const navigation = useNavigation();

    useRedirectIfDenied(PERMISSIONS.ASSETS_VIEW);
    const { denied: createDenied } = usePermission(PERMISSIONS.ASSETS_CREATE);

    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const filterSheetRef = useRef(null);

    const activeFilterCount = useMemo(
        () => Object.values(filters).filter(Boolean).length,
        [filters]
    );

    const debouncedSetSearch = useMemo(
        () => debounce((value) => setDebouncedSearch(value), 300),
        []
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ paddingRight: 8 }}>
                    <View style={styles.headerButtonGroup}>
                        <Pressable onPress={() => filterSheetRef.current?.present()} hitSlop={4}>
                            <View style={{ width: 26, height: 26 }}>
                                <Ionicons name="funnel-outline" size={22} color={colors.text} style={{ position: 'absolute', bottom: 0, left: 0 }} />
                                {activeFilterCount > 0 && (
                                    <View style={[styles.filterBadge, { top: 0, right: 0 }]}>
                                        <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                                    </View>
                                )}
                            </View>
                        </Pressable>
                        {!createDenied && (
                            <Pressable onPress={() => router.push('/(tabs)/(assets)/create')} hitSlop={4}>
                                <Ionicons name="add" size={26} color={colors.text} />
                            </Pressable>
                        )}
                    </View>
                </View>
            ),
            headerSearchBarOptions: {
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
    }, [navigation, colors.text, colors.primary, t, debouncedSetSearch, activeFilterCount, styles, createDenied]);

    // cancel any pending debounce on unmount so we don't update state after user navigates away
    useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

    const queryKey = assetKeys.list({ search: debouncedSearch, filters });

    const assetsQuery = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => makeRequest({
            url: `/hardware?${buildQuery({ offset: pageParam, search: debouncedSearch, filters })}`,
            method: 'get',
            permissionKey: PERMISSIONS.ASSETS_VIEW,
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
        await assetsQuery.refetch();
        setIsManualRefreshing(false);
    };

    const data = useMemo(
        () => assetsQuery.data?.pages.flatMap(page => page.rows ?? []) ?? [],
        [assetsQuery.data]
    );

    const loadMore = useCallback(() => {
        if (assetsQuery.hasNextPage && !assetsQuery.isFetchingNextPage) {
            assetsQuery.fetchNextPage();
        }
    }, [assetsQuery]);

    const removeFilter = useCallback((key) => {
        setFilters((prev) => ({ ...prev, [key]: null }));
    }, []);

    const FilterChipRow = useMemo(() => {
        if (activeFilterCount === 0) return null;
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
            >
                {Object.entries(filters).map(([key, value]) =>
                    value != null ? (
                        <FilterChip
                            key={key}
                            label={value.name}
                            onRemove={() => removeFilter(key)}
                        />
                    ) : null
                )}
            </ScrollView>
        );
    }, [filters, activeFilterCount, removeFilter, styles.chipRow]);

    const Item = ({ id, asset_tag, name, serial, image, checkedOut, status }) => (
        <Pressable
            onPress={() => router.push(`/${id}`)}
            style={({ pressed }) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            <View style={styles.imageContainer}>
                {image
                    ? <Image style={styles.image} src={image} />
                    : <Ionicons name="desktop-outline" size={40} color={colors.textSecondary} />
                }
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.assetTag}>#{asset_tag}</Text>
                <Text style={styles.assetName}>{decode(name)}</Text>
                {checkedOut && (
                    <Text style={styles.checkedOutText}>
                        {t('general.checked_out_to')}<Text style={styles.userName}>{checkedOut.name}</Text>
                    </Text>
                )}
                {status.status_type === 'deployable' ?
                    (
                        <Text style={styles.availableText}>{status.name}</Text>
                    ) :
                    <Text style={styles.notAvailableText}>{status.name}</Text>
                }
                <Text style={styles.serialText}>{serial ? t('mobile.serial_number_display', { serial }) : t('mobile.serial_number_empty')}</Text>
            </View>
        </Pressable>
    );

    if (!assetsQuery.isPending && data.length === 0 && !debouncedSearch && activeFilterCount === 0) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    icon="file-tray-outline"
                    title={t('mobile.no_results')}
                    message={t('mobile.no_results_message')}
                    onRetry={() => assetsQuery.refetch()}
                />
            </SafeAreaProvider>
        );
    }

    if (!assetsQuery.isPending && data.length === 0 && debouncedSearch) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    title={t('mobile.search_no_results')}
                    message={t('mobile.search_no_results_message')}
                    onRetry={() => {
                        debouncedSetSearch.cancel();
                        setDebouncedSearch('');
                    }}
                    retryLabel={t('mobile.clear_search')}
                />
                <AssetFilterBottomSheet
                    ref={filterSheetRef}
                    filters={filters}
                    onApply={(newFilters) => setFilters(newFilters)}
                />
            </SafeAreaProvider>
        );
    }

    if (!assetsQuery.isPending && data.length === 0 && activeFilterCount > 0) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    icon="funnel-outline"
                    title={t('mobile.filter_no_results')}
                    message={t('mobile.filter_no_results_message')}
                    onRetry={() => setFilters(EMPTY_FILTERS)}
                    retryLabel={t('mobile.clear_filters')}
                />
                <AssetFilterBottomSheet
                    ref={filterSheetRef}
                    filters={filters}
                    onApply={(newFilters) => setFilters(newFilters)}
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
                ListHeaderComponent={FilterChipRow}
                renderItem={({ item }) => <Item
                    id={item.id}
                    asset_tag={item.asset_tag}
                    name={item.model.name}
                    serial={item.serial}
                    image={item.image}
                    checkedOut={item.assigned_to}
                    status={item.status_label}
                />
                }
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={onManualRefresh} />}
            />
            <AssetFilterBottomSheet
                ref={filterSheetRef}
                filters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
            />
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    name: {
        fontWeight: FontWeight.bold,
    },
    flatlist: {
        flex: 1,
        padding: 5,
        flexDirection: 'column',
        gap: 5,
        backgroundColor: colors.background,
        shadowOffset: {
            width: 1,
            height: -1,
        },
        shadowOpacity: 0.10,
        shadowRadius: 20,
    },
    innerText: {
        color: colors.primary,
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
    },
    assetTag: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    assetName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    checkedOutText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    userName: {
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
    availableText: {
        color: colors.success,
        fontWeight: FontWeight.medium,
    },
    notAvailableText: {
        color: colors.danger,
        fontWeight: FontWeight.medium,
    },
    serialText: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
    headerButtonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    filterBadgeText: {
        fontSize: 9,
        color: '#ffffff',
        fontWeight: FontWeight.bold,
    },
    chipRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
});
