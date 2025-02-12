import {View, Text, StyleSheet, FlatList, Image, RefreshControl, Pressable} from 'react-native';
import {useContext, useState, useEffect, useCallback} from "react";
import {AuthContext} from "../../../context/AuthProvider";
import {makeRequest} from "../../../helpers/axiosConfig";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {router, useFocusEffect} from "expo-router";

export default function AssetsScreen() {
    const { user } = useContext(AuthContext);
    // console.log(JSON.parse(user));
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async() => {
            setRefreshing(true);
        try {
            await getAssets();
        } finally {
            setRefreshing(false);
        }
    }, [loading]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            setRefreshing(true);
            // hm, just playing around with async stuff
            // to see if i could get the refreshing indicator
            // to show during the useFocusEffect event
            async function test(){
                await getAssets();
            }
            test();
            setRefreshing(false);
        }, [])
    )

    const getAssets = async () => {
        try {
            const res = await makeRequest({
                url: '/hardware?limit=100&offset=0&sort=created_at&order=desc', //this will turn into a builder function
                // to build up the query string
                method: 'get',
                headers: {'Authorization': `Bearer ${user.token}`}
            })
            setData({
                assets: res.rows,
                count: res.total
            });
            // console.log(data);
            // console.log(data);
            setLoading(false);
        } catch (error) {
            console.log(error);
        }
    }

    const Item = ({id, name, serial, image, checkedOut}) => (
        <Pressable onPress={() => router.push(`/${id}`)}>
            <View style={{
                padding: 10,
                marginVertical: 8,
                backgroundColor: '#eee',
                borderRadius: 8,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                shadowOffset: {
                    width: 1,
                    height: -1,
                },
                shadowOpacity: 0.10,
                shadowRadius: 20,
            }}>
                <Image style={{
                    width: 100,
                    height: 100,

                }} src={image} />
                <Text style={styles.name}>ID: {id}</Text>
                <Text style={styles.name}>{name}</Text>
                {checkedOut ? <Text style={styles.innerText}>Checked out to: {checkedOut.name}</Text> : <Text>Not Checkout Out</Text>}
                <Text>{serial}</Text>
            </View>
        </Pressable>
    );

    return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
            <FlatList
                data={data.assets}
                renderItem={({item}) => <Item id={item.id} name={item.model.name} serial={item.serial} image={item.image} checkedOut={item.assigned_to}/>}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ></FlatList>
                    </SafeAreaView>
                </SafeAreaProvider>
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