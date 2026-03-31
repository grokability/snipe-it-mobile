import {View, Text, StyleSheet, Image, RefreshControl, Pressable, Platform} from 'react-native';
import {useContext, useState, useCallback, useMemo, useLayoutEffect, useRef, useEffect} from "react";
import debounce from 'lodash/debounce';
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {router, useFocusEffect, useNavigation} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {decode} from "html-entities";
import {FlashList} from "@shopify/flash-list";
import {useTranslation} from "react-i18next";
import {Ionicons} from '@expo/vector-icons';
import EmptyState from "@/components/ui/EmptyState";

export default function AssetsScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const navigation = useNavigation();

    const { user } = useContext(AuthContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debouncedSearchRef = useRef('');
    const isFirstRenderRef = useRef(true);

    const debouncedSetSearch = useMemo(
        () => debounce((value) => setDebouncedSearch(value), 300),
        []
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable onPress={() => router.push('/(tabs)/(assets)/create')}>
                    <Ionicons name="add" size={26} color={colors.text} />
                </Pressable>
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
    }, [navigation, colors.text, colors.primary, t, debouncedSetSearch]);

    // cancel any pending debounce on unmount so we don't update state after user navigates away
    useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

    // Keep ref in sync so useFocusEffect can always read the latest search without changing its callback
    useEffect(() => {
        debouncedSearchRef.current = debouncedSearch;
    }, [debouncedSearch]);

    const getAssets = useCallback(({ offset: fetchOffset = 0, search: fetchSearch = '' } = {}) => {
        setLoading(true);
        const query = 'limit=25&' +
            `offset=${fetchOffset}&` +
            'sort=created_at&' +
            'order=asc' +
            (fetchSearch ? `&search=${encodeURIComponent(fetchSearch)}` : '');
        return makeRequest({ url: `/hardware?${query}`, method: 'get' })
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
    // Stable callback (getAssets has no deps) — reads current search via ref to avoid
    // re-running on every debouncedSearch change while the screen is already focused.
    useFocusEffect(
        useCallback(() => {
            setOffset(0);
            setData([]);
            getAssets({ offset: 0, search: debouncedSearchRef.current });
        }, [getAssets])
    );

    // Re-fetch when debouncedSearch changes while the screen is focused.
    // Skip the initial render — useFocusEffect handles that fetch.
    useEffect(() => {
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }
        setOffset(0);
        setData([]);
        getAssets({ offset: 0, search: debouncedSearch });
    }, [debouncedSearch, getAssets]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setOffset(0);
        setData([]);
        getAssets({ offset: 0, search: debouncedSearch })
            .finally(() => setRefreshing(false));
    }, [debouncedSearch, getAssets]);

    const loadMore = useCallback(() => {
        if (loading || !hasMore) return;
        const nextOffset = offset + 25;
        setOffset(nextOffset);
        getAssets({ offset: nextOffset, search: debouncedSearch });
    }, [loading, hasMore, offset, debouncedSearch, getAssets]);

    const Item = ({id, asset_tag, name, serial, image, checkedOut, status}) => (
        <Pressable
            onPress={() => router.push(`/${id}`)}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            <View style={styles.imageContainer}>
                <Image style={styles.image} src={image} />
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

    if (!loading && data.length === 0) {
        if (debouncedSearch) {
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
                </SafeAreaProvider>
            );
        }
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState onRetry={() => getAssets({ offset: 0, search: '' })} />
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
                    renderItem={({item}) => <Item
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
});
