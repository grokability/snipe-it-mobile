import {View, Text, StyleSheet, RefreshControl, Pressable, Platform} from 'react-native';
import {useContext, useState, useCallback, useMemo} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {router, useFocusEffect} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {FlashList} from "@shopify/flash-list";
import {decode} from "html-entities";
import {useTranslation} from "react-i18next";
import {Image} from "react-native";
import EmptyState from "@/components/ui/EmptyState";

export default function AccessoriesScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { user } = useContext(AuthContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getAccessories = useCallback(() => {
        setLoading(true);
        return makeRequest({
            method: 'get',
            url: '/accessories'
        })
            .then(res => {
                if (res?.rows) {
                    setData({
                        accessories: res.rows,
                        count: res.total
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
            getAccessories();
        }, [getAccessories])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getAccessories()
            .finally(() => {
                setRefreshing(false);
            });
    }, [getAccessories]);

    const Item = ({id, image, name, category, manufacturer, qty, remaining_qty}) => {
        const available = remaining_qty > 0;
        return (
            <Pressable
                onPress={() => router.push(`/(accessories)/${id}`)}
                style={({pressed}) => [
                    styles.itemContainer,
                    pressed && styles.itemPressed
                ]}
            >
                <View style={styles.imageContainer}>
                    <Image style={styles.image} src={image} />
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
                                {remaining_qty}/{qty}
                            </Text>
                        </View>
                        <View style={[styles.availDot, available ? styles.availDotGreen : styles.availDotRed]} />
                        <Text style={[styles.availText, available ? styles.availTextGreen : styles.availTextRed]}>
                            {available ? t('mobile.available') : t('mobile.out_of_stock')}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    if (!loading && (!data.accessories || data.accessories.length === 0)) {
        return (
            <SafeAreaProvider style={styles.container}>
                <EmptyState onRetry={getAccessories} />
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <FlashList
                contentContainerStyle={{
                    paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0,
                    paddingBottom: 80
                }}
                style={styles.flatlist}
                data={data.accessories}
                estimatedItemSize={120}
                renderItem={({item}) => <Item
                    id={item.id}
                    image={item.image}
                    name={item.name}
                    category={item.category}
                    manufacturer={item.manufacturer}
                    qty={item.qty}
                    remaining_qty={item.remaining_qty}
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
