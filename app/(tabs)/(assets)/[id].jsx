import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ActivityIndicator, Button, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {makeRequest} from "../../../helpers/axiosConfig";
import {AuthContext} from "../../../context/AuthProvider";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {COLORS} from "../../../constants/colors";


export const unstable_settings = {
    // Ensure any route can link back to `/`
    initialRouteName: 'index',
};


export default function AssetScreen() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
                getAsset();
            setLoading(false);
        }, [])
    )

    const DetailRow = ({label, value}) => {
        return (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        )
    }

    function getAsset() {
        makeRequest({
            url: `/hardware/${id}`,
            method: 'get',
            headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(res => {
            setData({asset: res})
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

    if(loading || !data.asset) {
        return (
            <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                <ActivityIndicator size="large" color="purple"/>
            </View>
        )
    }

        return (
            <SafeAreaProvider>
                <View style={styles.container}>
                    <View style={styles.imageContainer}>
                        <Image source={{uri: data.asset.image}} style={styles.image}/>
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.assetTitle}>Asset #{id}</Text>
                        <View style={styles.detailsContainer}>
                            <DetailRow label="Age" value={data.asset?.age || 'N/A'}/>
                            <DetailRow label="Name" value={data.asset?.name || 'N/A'}/>
                            <DetailRow label="Serial" value={data.asset?.serial || 'N/A'}/>
                        </View>

                        <View style={styles.assignmentContainer}>
                            {data.asset.assigned_to ? (
                                <>
                                    <Text style={styles.assignedText}>
                                        Assigned to: <Text style={styles.userName}>{data.asset.assigned_to.name}</Text>
                                    </Text>
                                    <Pressable
                                        style={({pressed}) => [styles.button, styles.checkinButton, pressed && styles.buttonPressed]}
                                        onPress={() => router.push(`/(tabs)/(assets)/checkin/${id}`)}
                                    >
                                        <Text style={styles.buttonText}>Check In</Text>
                                    </Pressable>
                                </>
                            ) : (
                                <Pressable
                                    style={({pressed}) => [styles.button, styles.checkoutButton, pressed && styles.buttonPressed]}
                                    onPress={() => router.push(`/(tabs)/(assets)/checkout/${id}`)}
                                >
                                    <Text style={styles.buttonText}>Check Out</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>

            </SafeAreaProvider>
        );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff'
    },
    imageContainer: {
        alignItems: 'center',
        backgroundColor: '#f8f4ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24
    },
    image: {
        width: 250,
        height: 250,
        borderRadius: 12
    },
    infoContainer: {
        gap: 24
    },
    assetTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8
    },
    detailsContainer: {
        backgroundColor: '#f8f4ff',
        padding: 16,
        borderRadius: 12,
        gap: 12
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    detailLabel: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500'
    },
    detailValue: {
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '600'
    },
    assignmentContainer: {
        alignItems: 'center',
        gap: 16
    },
    assignedText: {
        fontSize: 16,
        color: '#666'
    },
    userName: {
        color: COLORS.light.primary,
        fontWeight: '600'
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    checkinButton: {
        backgroundColor: '#FF5252'
    },
    checkoutButton: {
        backgroundColor: '#4CAF50'
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}]
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
