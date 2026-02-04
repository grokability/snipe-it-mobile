import {View, Text, StyleSheet, FlatList, Image, RefreshControl} from 'react-native';
import {useContext, useState, useEffect, useCallback} from "react";
import {AuthContext} from "@/context/AuthProvider";
import {makeRequest} from "@/helpers/axiosConfig";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

export default function AccessoriesScreen() {
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
                setData({
                    accessories: res.rows,
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
        getAccessories()
            .finally(() => {
                setRefreshing(false);
            });
    }, [getAccessories]);

    useEffect(() => {
        getAccessories();
    }, []);

    const Item = ({image, name, qty}) => (
        <View style={{padding: 10, marginVertical: 8, backgroundColor: '#eee', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
            <Image style={{width: 100, height: 100}} src={image} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.name}>Qty: {qty}</Text>
        </View>
    );



    return (
        <SafeAreaView style={styles.container}>
            <Text>Accessories Index</Text>
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <FlatList
                        data={data.accessories}
                        renderItem={({item}) => <Item
                            image={item.image}
                            name={item.name}
                            qty={item.qty}
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