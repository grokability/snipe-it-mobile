import {View, Text, StyleSheet, RefreshControl, Platform, Image} from 'react-native';
import {useCallback, useMemo, useState} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {useRedirectIfDenied} from "@/permissions/PermissionContext";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useFocusEffect} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {FlashList} from "@shopify/flash-list";
import {decode} from "html-entities";
import {useTranslation} from "react-i18next";
import {Ionicons} from "@expo/vector-icons";
import EmptyState from "@/components/ui/EmptyState";

export default function ComponentsScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    useRedirectIfDenied(PERMISSIONS.COMPONENTS_VIEW);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getComponents = useCallback(() => {
        setLoading(true);
        return makeRequest({
            method: 'get',
            url: '/components',
            permissionKey: PERMISSIONS.COMPONENTS_VIEW,
        })
            .then(res => {
                if (res?.rows) {
                    setData({
                        components: res.rows,
                        count: res.total,
                    });
                }
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            getComponents();
        }, [getComponents])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getComponents().finally(() => setRefreshing(false));
    }, [getComponents]);

    const Item = ({image, name, category, manufacturer, qty, remaining}) => {
        const available = remaining > 0;
        return (
            <View style={styles.itemContainer}>
                <View style={styles.imageContainer}>
                    {image
                        ? <Image style={styles.image} src={image} />
                        : <Ionicons name="construct-outline" size={40} color={colors.textSecondary} />
                    }
                </View>
                <View style={styles.contentContainer}>
                    <Text style={styles.itemName}>{decode(name)}</Text>
                    {category?.name ? (
                        <Text style={styles.metaText}>{category.name}</Text>
                    ) : null}
                    {manufacturer?.name ? (
                        <Text style={styles.metaText}>{manufacturer.name}</Text>
                    ) : null}
                    <View style={styles.footer}>
                        <View style={[styles.qtyBadge, available ? styles.qtyBadgeAvailable : styles.qtyBadgeEmpty]}>
                            <Text style={[styles.qtyBadgeText, available ? styles.qtyBadgeTextAvailable : styles.qtyBadgeTextEmpty]}>
                                {remaining}/{qty}
                            </Text>
                        </View>
                        <View style={[styles.availDot, available ? styles.availDotGreen : styles.availDotRed]} />
                        <Text style={[styles.availText, available ? styles.availTextGreen : styles.availTextRed]}>
                            {available ? t('general.available') : t('general.not_available')}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (!loading && (!data.components || data.components.length === 0)) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState
                    icon="file-tray-outline"
                    title={t('mobile.no_results')}
                    message={t('mobile.no_results_message')}
                    onRetry={getComponents}
                />
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <FlashList
                contentContainerStyle={{
                    paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0,
                    paddingBottom: 80,
                }}
                style={styles.flatlist}
                data={data.components}
                estimatedItemSize={120}
                renderItem={({item}) => <Item
                    image={item.image}
                    name={item.name}
                    category={item.category}
                    manufacturer={item.manufacturer}
                    qty={item.qty}
                    remaining={item.remaining}
                />}
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
    itemContainer: {
        width: '100%',
        padding: Spacing.lg,
        marginVertical: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        gap: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
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
        gap: 4,
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
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    qtyBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    qtyBadgeAvailable: {
        backgroundColor: colors.successBackground ?? colors.success + '22',
    },
    qtyBadgeEmpty: {
        backgroundColor: colors.dangerBackground ?? colors.danger + '22',
    },
    qtyBadgeText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
    },
    qtyBadgeTextAvailable: {
        color: colors.success,
    },
    qtyBadgeTextEmpty: {
        color: colors.danger,
    },
    availDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    availDotGreen: {
        backgroundColor: colors.success,
    },
    availDotRed: {
        backgroundColor: colors.danger,
    },
    availText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
    },
    availTextGreen: {
        color: colors.success,
    },
    availTextRed: {
        color: colors.danger,
    },
});
