import {View, Text, StyleSheet, Image, RefreshControl, Pressable, Platform} from 'react-native';
import {useContext, useState, useCallback, useMemo, useLayoutEffect} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {router, useFocusEffect, useNavigation} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {decode} from "html-entities";
import {FlashList} from "@shopify/flash-list";
import {useTranslation} from "react-i18next";
import EmptyState from "@/components/ui/EmptyState";
import TopNavMenu from "@/components/overlays/TopNavMenu";
import {useNetworkStatus} from "@/hooks/useNetworkStatus";
import {cacheAssets, getCachedAssets, getCacheMeta} from "@/helpers/db/cacheManager";
import {CacheBadge} from "@/components/ui/CacheBadge";

export default function AssetsScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const navigation = useNavigation();
    const { user } = useContext(AuthContext);
    const { isConnected } = useNetworkStatus();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFromCache, setIsFromCache] = useState(false);
    const [cachedAt, setCachedAt] = useState(null);

    const [offset, setOffset] = useState(0);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    {isFromCache && cachedAt && <CacheBadge cachedAt={cachedAt} />}
                    <TopNavMenu />
                </View>
            ),
        });
    }, [isFromCache, cachedAt]);

    const loadFromCache = useCallback(async () => {
        const cached = await getCachedAssets('index');
        const meta = await getCacheMeta('index');
        setData(cached);
        setIsFromCache(cached.length > 0);
        setCachedAt(meta?.last_synced_at || cached[0]?._cachedAt || null);
    }, []);

    const getAssets = useCallback((currentOffset = offset, reset = false) => {
        if (!isConnected) {
            return loadFromCache();
        }

        setLoading(true);
        return makeRequest({
            url: '/hardware?' +
                'limit=25&' +
                `offset=${currentOffset}&` +
                'sort=created_at&' +
                'order=asc',
            method: 'get'
        })
            .then((res) => {
                if (res?.rows) {
                    if (reset) {
                        setData(res.rows);
                    } else {
                        setData((existingItems) => [...existingItems, ...res.rows]);
                    }
                    setIsFromCache(false);
                    setCachedAt(null);

                    if (res.rows.length > 0) {
                        cacheAssets(res.rows, 'index').catch(() => {});
                    }
                }
            })
            .catch(err => {
                console.log(err);
                if (currentOffset === 0) {
                    return loadFromCache();
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [offset, isConnected, loadFromCache]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            getAssets(0, true).finally(() => setLoading(false));
        }, [isConnected])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setData([]);
        setOffset(0);
        getAssets(0, true).finally(() => setRefreshing(false));
    }, [getAssets]);

    const loadMore = () => {
        if (loading || isFromCache) return;
        const newOffset = offset + 25;
        setOffset(newOffset);
        getAssets(newOffset);
    }

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
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState onRetry={() => { setOffset(0); getAssets(); }} />
            </SafeAreaProvider>
        );
    }

    return (
            <SafeAreaProvider style={styles.container}>
                <FlashList
                    onEndReached={() => loadMore()}
                    onEndReachedThreshold={0.1}
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}  />}

                ></FlashList>
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
