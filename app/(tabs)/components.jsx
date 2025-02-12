import {View, Text, StyleSheet, FlatList, Image, RefreshControl} from 'react-native';
import {useContext, useState, useEffect, useCallback} from "react";
import {AuthContext} from "../../context/AuthProvider";
import {makeRequest} from "../../helpers/axiosConfig";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {getComponentIds} from "expo-router/build/rsc/router/common";

export default function ComponentsScreen() {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        if(loading) {
            setRefreshing(true);
        }
        getComponents();
        setRefreshing(false);
    }, [getComponents, loading]);


    useEffect(() => {
        getComponents();
    }, [loading]);

    const Item = ({image, name, qty}) => (
        <View style={{padding: 10, marginVertical: 8, backgroundColor: '#eee', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
            <Image style={{width: 100, height: 100}} src={image} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.name}>Qty: {qty}</Text>
        </View>
    );

    function getComponents() {
        makeRequest({
            method: 'get',
            url: '/components',
            headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(res => {
            setData({
                components: res.rows,
                count: res.total
            });
            console.log(data.count);
            setLoading(false);
        }).catch(err => {
            console.log(err);
        });
    }




    return (
        <SafeAreaView style={styles.container}>
            <Text>Components Index</Text>
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    {data.count > 0 &&
                        <FlatList
                            data={data.components}
                            renderItem={({item}) => <Item
                                image={item.image}
                                name={item.name}
                                qty={item.qty}
                            />}
                            keyExtractor={item => item.id}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ></FlatList>
                    }
                    {data.count === 0 &&
                        <Text>No components found</Text>
                    }
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