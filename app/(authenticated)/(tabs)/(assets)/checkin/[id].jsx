import React, {useContext} from 'react';
import {Text, Button} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {StyleSheet} from "react-native";

export default function CheckoutScreen() {
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    function checkin() {
        makeRequest({
            url: `/hardware/${id}/checkin`,
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.token}` },
            data: {
                status_id: 1,
            }
        }).then(res => {
            console.log(res);
            router.replace(`/(tabs)/(assets)/${id}`)
        }).catch(err => {
            console.log(err);
        })
        console.log('checkout');
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <Text>Checkin Asset {id}</Text>
            <Button title="Checkin" onPress={() => checkin()} />
        </SafeAreaProvider>
    )
}
StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})