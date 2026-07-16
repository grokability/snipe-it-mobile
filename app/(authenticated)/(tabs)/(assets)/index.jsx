import { View, Text, StyleSheet, Image, RefreshControl, Pressable, Platform, ScrollView } from 'react-native';
import { useState, useCallback, useMemo, useLayoutEffect, useRef, useEffect } from "react";
import debounce from 'lodash/debounce';
import { makeRequest } from "@/helpers/axiosConfig";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
// `expo-router`'s own header marks this re-export "deprecated" (copy into codebase), but it's
// the only `useHeaderHeight` guaranteed to read the same HeaderHeightContext that expo-router's
// native-stack actually renders with — a standalone `@react-navigation/elements` install would not.
import { useHeaderHeight } from "expo-router/build/react-navigation/elements";
import { router, useFocusEffect, useNavigation } from "expo-router";
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

const FilterChipRow = ({ filters, onRemoveFilter, styles }) => (
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
                    onRemove={() => onRemoveFilter(key)}
                />
            ) : null
        )}
    </ScrollView>
);

export default function AssetsScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const navigation = useNavigation();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useRedirectIfDenied(PERMISSIONS.ASSETS_VIEW);
    const { denied: createDenied } = usePermission(PERMISSIONS.ASSETS_CREATE);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debouncedSearchRef = useRef('');
    const isSearchFirstRenderRef = useRef(true);
    const isFiltersFirstRenderRef = useRef(true);

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const filtersRef = useRef(EMPTY_FILTERS);
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
                placement: 'integratedButton',
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

    // Keep refs in sync so useFocusEffect can always read the latest values without changing its callback
    useEffect(() => {
        debouncedSearchRef.current = debouncedSearch;
    }, [debouncedSearch]);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    const buildQuery = ({ offset: fetchOffset = 0, search: fetchSearch = '', filters: fetchFilters = EMPTY_FILTERS }) => {
        let query = `limit=25&offset=${fetchOffset}&sort=created_at&order=asc`;
        if (fetchSearch) query += `&search=${encodeURIComponent(fetchSearch)}`;
        if (fetchFilters.status) query += `&status_id=${fetchFilters.status.id}`;
        if (fetchFilters.category) query += `&category_id=${fetchFilters.category.id}`;
        if (fetchFilters.manufacturer) query += `&manufacturer_id=${fetchFilters.manufacturer.id}`;
        if (fetchFilters.supplier) query += `&supplier_id=${fetchFilters.supplier.id}`;
        if (fetchFilters.location) query += `&location_id=${fetchFilters.location.id}`;
        if (fetchFilters.company) query += `&company_id=${fetchFilters.company.id}`;
        if (fetchFilters.model) query += `&model_id=${fetchFilters.model.id}`;
        return query;
    };

    const getAssets = useCallback(({ offset: fetchOffset = 0, search: fetchSearch = '', filters: fetchFilters = EMPTY_FILTERS } = {}) => {
        setLoading(true);
        const query = buildQuery({ offset: fetchOffset, search: fetchSearch, filters: fetchFilters });
        return makeRequest({ url: `/hardware?${query}`, method: 'get', permissionKey: PERMISSIONS.ASSETS_VIEW })
            .then((res) => {
                if (res?.rows) {
                    if (fetchOffset === 0) {
                        setData(res.rows);
                    } else {
                        setData((prev) => [...prev, ...res.rows]);
                    }
                    setHasMore(res.rows.length === 25);
                }
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Initial load + refetch when screen regains focus.
    useFocusEffect(
        useCallback(() => {
            setOffset(0);
            setData([]);
            getAssets({ offset: 0, search: debouncedSearchRef.current, filters: filtersRef.current });
        }, [getAssets])
    );

    // Re-fetch when debouncedSearch changes while the screen is focused.
    useEffect(() => {
        if (isSearchFirstRenderRef.current) {
            isSearchFirstRenderRef.current = false;
            return;
        }
        setOffset(0);
        setData([]);
        getAssets({ offset: 0, search: debouncedSearch, filters });
    }, [debouncedSearch, getAssets]);

    // Re-fetch when filters change (chip removal or sheet apply)
    useEffect(() => {
        if (isFiltersFirstRenderRef.current) {
            isFiltersFirstRenderRef.current = false;
            return;
        }
        setOffset(0);
        setData([]);
        getAssets({ offset: 0, search: debouncedSearch, filters });
    }, [filters]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setOffset(0);
        setData([]);
        getAssets({ offset: 0, search: debouncedSearch, filters })
            .finally(() => setRefreshing(false));
    }, [debouncedSearch, filters, getAssets]);

    const loadMore = useCallback(() => {
        if (loading || !hasMore) return;
        const nextOffset = offset + 25;
        setOffset(nextOffset);
        getAssets({ offset: nextOffset, search: debouncedSearch, filters });
    }, [loading, hasMore, offset, debouncedSearch, filters, getAssets]);

    const removeFilter = useCallback((key) => {
        setFilters((prev) => ({ ...prev, [key]: null }));
    }, []);

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

    if (!loading && data.length === 0 && !debouncedSearch && activeFilterCount === 0) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    icon="file-tray-outline"
                    title={t('mobile.no_results')}
                    message={t('mobile.no_results_message')}
                    onRetry={() => getAssets()}
                />
            </SafeAreaProvider>
        );
    }

    if (!loading && data.length === 0 && debouncedSearch) {
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

    if (!loading && data.length === 0 && activeFilterCount > 0) {
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
            {activeFilterCount > 0 && (
                <View style={{ paddingTop: headerHeight }}>
                    <FilterChipRow filters={filters} onRemoveFilter={removeFilter} styles={styles} />
                </View>
            )}
            <FlashList
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{
                    paddingTop: Platform.OS === 'android' && activeFilterCount === 0 ? insets.top + 56 : 0,
                    paddingBottom: 80
                }}
                style={styles.flatlist}
                data={data}
                renderItem={({ item }) => (
                    <Item
                        id={item.id}
                        asset_tag={item.asset_tag}
                        name={item.model.name}
                        serial={item.serial}
                        image={item.image}
                        checkedOut={item.assigned_to}
                        status={item.status_label}
                    />
                )}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
