import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ActivityIndicator, Button, Image, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {makeRequest} from "../../../helpers/axiosConfig";
import {AuthContext} from "../../../context/AuthProvider";
import {SafeAreaProvider} from "react-native-safe-area-context";

export const unstable_settings = {
    // Ensure any route can link back to `/`
    initialRouteName: 'index',
};


export default function AssetScreen() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();


    // TODO: this is too many useEffects, refactor

    // watch for id to change and re-fetch
    useEffect(() => {
        setLoading(true);
        getAsset();
    }, [id]);

    useEffect(() => {
        setLoading(true);
            getAsset();
            setLoading(false);
    }, []);
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
                getAsset();
            setLoading(false);
        }, [])
    )


    function getAsset() {
        makeRequest({
            url: `/hardware/${id}`,
            method: 'get',
            headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(res => {
            setData({asset: null})
            setData({
                asset: res,
            });
            setLoading(false);
        }).catch(err => {
            console.log(err);
        });
    }

    if(loading) {
        return (
            <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                <ActivityIndicator size="large" color="purple"/>
            </View>
        )
    }

    if(loading && !data.asset) {
        return (
            <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                <ActivityIndicator size="large" color="purple"/>
            </View>
        )
    }

    if(data.asset) {
        return (
            <SafeAreaProvider>
                <Image source={{uri: data.asset.image}} style={{width: 200, height: 200}}/>
                <Text>Asset {id}</Text>
                <Text>Age: {data.asset?.age}</Text>
                <Text>Name: {data.asset?.name}</Text>
                <Text>Serial: {data.asset?.serial}</Text>

                {data.asset.assigned_to ?
                    <View>
                        <Text>Assigned to: {data.asset.assigned_to.name}</Text>
                        <Button title='Checkin'
                                onPress={() => router.push(`/(tabs)/(assets)/checkin/${id}`)}
                        >Checkin</Button>
                    </View>
                    :
                    <View>
                            <Button title='Checkout'
                            onPress={() => router.push(`/(tabs)/(assets)/checkout/${id}`)}
                            >
                                Checkout
                            </Button>
                    </View>
                }
            </SafeAreaProvider>
        );
    }
}