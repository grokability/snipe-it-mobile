import React, {useContext} from 'react';
import {Text, Button} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {StyleSheet} from "react-native";
import {Colors} from "@/constants/colors";
import {Typography, FontWeight, Spacing} from "@/constants/sizes";

export default function CheckoutScreen() {
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    function checkin() {
        console.log('checkin');
        makeRequest({
            url: `/hardware/${id}/checkin`,
            method: 'POST',
            data: {
                status_id: 1,
            }
        })
            .then(res => {
                console.log(res);
                router.replace(`/(tabs)/(assets)/${id}`)
            })
            .catch(err => {
                console.log(err);
            });
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <Text style={styles.title}>Checkin Asset {id}</Text>
            <Button title="Checkin" onPress={() => checkin()} />
        </SafeAreaProvider>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    title: {
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
        marginBottom: Spacing.lg,
    },
})
