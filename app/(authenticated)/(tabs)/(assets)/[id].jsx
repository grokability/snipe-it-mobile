import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ActivityIndicator, Button, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Colors} from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";


export const unstable_settings = {
    // Ensure any route can link back to `/`
    initialRouteName: 'index',
};


export default function AssetScreen() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    const getAsset = useCallback(() => {
        setLoading(true);
        makeRequest({
            url: `/hardware/${id}`,
            method: 'get'
        })
            .then(res => {
                setData({
                    asset: res,
                });
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            getAsset();
        }, [getAsset])
    );

    const DetailRow = ({label, value}) => {
        return (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        )
    }

    if(loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary}/>
            </View>
        )
    }

    if(loading || !data.asset) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary}/>
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
        padding: Spacing.lg,
        backgroundColor: Colors.light.background
    },
    imageContainer: {
        alignItems: 'center',
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl
    },
    image: {
        width: 250,
        height: 250,
        borderRadius: BorderRadius.md
    },
    infoContainer: {
        gap: Spacing.xxl
    },
    assetTitle: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
        marginBottom: Spacing.sm
    },
    detailsContainer: {
        backgroundColor: Colors.light.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.md
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    detailLabel: {
        fontSize: Typography.bodyLarge,
        color: Colors.light.textSecondary,
        fontWeight: FontWeight.medium
    },
    detailValue: {
        fontSize: Typography.bodyLarge,
        color: Colors.light.text,
        fontWeight: FontWeight.semibold
    },
    assignmentContainer: {
        alignItems: 'center',
        gap: Spacing.lg
    },
    assignedText: {
        fontSize: Typography.bodyLarge,
        color: Colors.light.textSecondary
    },
    userName: {
        color: Colors.light.primary,
        fontWeight: FontWeight.semibold
    },
    button: {
        width: '100%',
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center'
    },
    checkinButton: {
        backgroundColor: Colors.light.danger
    },
    checkoutButton: {
        backgroundColor: Colors.light.success
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}]
    },
    buttonText: {
        color: Colors.light.background,
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold
    }
});
