import {View, Text, StyleSheet, FlatList, Image, RefreshControl} from 'react-native';
import {useContext, useState, useEffect, useCallback} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

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
        <View style={{padding: 10, marginVertical: 8, backgroundColor: '#eee', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
            <Image style={{width: 100, height: 100}} src={image} />
            <Text style={styles.name}>{license_name}</Text>
            <Text style={styles.name}>{manufacturer_name} ({supplier_name})</Text>
            <Text style={styles.innerText}>{product_key}</Text>
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
            <Text>Licenses Index</Text>
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
    name: {
        fontWeight: 'bold',
    },
    innerText: {
        color: 'red',
    },
});