import {View, Text, StyleSheet, FlatList, Image, RefreshControl} from 'react-native';
import {useContext, useState, useEffect, useCallback, useMemo} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {decode} from "html-entities";
import {useTranslation} from "react-i18next";

export default function LicensesScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { user } = useContext(AuthContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        if(loading) {
            setRefreshing(true);
        }
        getLicenses();
        setRefreshing(false);
    }, [getLicenses, loading]);

    useEffect(() => {
        getLicenses();
    }, [loading]);

    const Item = ({license_name, image, product_key, supplier_name, manufacturer_name}) => (
        <View style={styles.itemContainer}>
            <Image style={styles.image} src={image} />
            <Text style={styles.name}>{decode(license_name)}</Text>
            <Text style={styles.name}>{decode(manufacturer_name)} ({decode(supplier_name)})</Text>
            <Text style={styles.productKey}>{decode(product_key)}</Text>
        </View>
    );

    function getLicenses() {
        makeRequest({
            method: 'get',
            url: '/licenses',
            headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(res => {
            setData({
                licenses: res.rows,
                count: res.total
            });
            setLoading(false);
        }).catch(err => {
            console.log(err);
        });
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{t('mobile.licenses_title')}</Text>
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <FlatList
                        data={data.licenses}
                        renderItem={({item}) => <Item
                            license_name={item.license_name}
                            product_key={item.product_key}
                            manufacturer_name={item.manufacturer.name}
                            supplier_name={item.supplier.name}
                            image={item.image}
                        />}
                        keyExtractor={item => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ></FlatList>
                </SafeAreaView>
            </SafeAreaProvider>
        </SafeAreaView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.semibold,
        color: colors.text,
        marginBottom: Spacing.md,
    },
    itemContainer: {
        padding: Spacing.md,
        marginVertical: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    image: {
        width: 100,
        height: 100,
    },
    name: {
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    productKey: {
        color: colors.primary,
        fontSize: Typography.body,
    },
});
