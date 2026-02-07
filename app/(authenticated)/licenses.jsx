import {View, Text, StyleSheet, FlatList, Image, RefreshControl} from 'react-native';
import {useContext, useState, useEffect, useCallback} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {Colors} from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";

export default function LicensesScreen() {
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
            <Text style={styles.name}>{license_name}</Text>
            <Text style={styles.name}>{manufacturer_name} ({supplier_name})</Text>
            <Text style={styles.productKey}>{product_key}</Text>
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
            // console.log(data.licenses[0].manufacturer.name);
            setLoading(false);
        }).catch(err => {
            console.log(err);
        });
    }



    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Licenses Index</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.semibold,
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },
    itemContainer: {
        padding: Spacing.md,
        marginVertical: Spacing.sm,
        backgroundColor: Colors.light.backgroundTertiary,
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
        color: Colors.light.text,
    },
    productKey: {
        color: Colors.light.primary,
        fontSize: Typography.body,
    },
});
