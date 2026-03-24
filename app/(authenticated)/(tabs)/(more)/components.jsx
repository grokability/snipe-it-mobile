import {View, Text, StyleSheet, Image, RefreshControl, Platform} from 'react-native';
import {useContext, useState, useEffect, useCallback, useMemo} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {FlashList} from "@shopify/flash-list";
import {decode} from "html-entities";
import {useTranslation} from "react-i18next";

export default function ComponentsScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { user } = useContext(AuthContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getComponents = useCallback(() => {
        setLoading(true);
        return makeRequest({
            method: 'get',
            url: '/components'
        })
            .then(res => {
                setData({
                    components: res.rows,
                    count: res.total
                });
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getComponents()
            .finally(() => {
                setRefreshing(false);
            });
    }, [getComponents]);

    useEffect(() => {
        getComponents();
    }, []);

    const Item = ({image, name, qty}) => (
        <View style={styles.itemContainer}>
            <View style={styles.imageContainer}>
                <Image style={styles.image} src={image} />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.itemName}>{decode(name)}</Text>
                <Text style={styles.qtyText}>{t('general.qty', { count: qty })}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaProvider style={styles.container}>
            {data.count > 0 ? (
                <FlashList
                    contentContainerStyle={{
                        paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0,
                        paddingBottom: 80
                    }}
                    style={styles.flatlist}
                    data={data.components}
                    renderItem={({item}) => <Item
                        image={item.image}
                        name={item.name}
                        qty={item.qty}
                    />}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('mobile.no_components')}</Text>
                </View>
            )}
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
    itemName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    qtyText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: Typography.body,
    },
});
