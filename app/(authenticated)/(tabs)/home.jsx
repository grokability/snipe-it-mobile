import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Button, Platform} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import {Link, router} from "expo-router";
import React, {useEffect, useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import Constants from "expo-constants/src/Constants";
import ExpoApplication from "expo-application/src/ExpoApplication";
import RecentActions from "@/components/RecentActions";

export default function HomeScreen() {
    // kind of weird that you have to type it but it's still just a string?
    const [permission, requestPermission] = useCameraPermissions();
    useEffect(() => {
        console.log(permission);

        console.log(permission?.granted);
    })



    if (!permission) {
        // Camera permissions are still loading.
        return (
            <SafeAreaView style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                <ActivityIndicator size="large" color="purple"/>
            </SafeAreaView>
        )
    }

        return (
            <SafeAreaView style={styles.container}>
                    <RecentActions />
                    <Text style={styles.text}>Version: {ExpoApplication.nativeApplicationVersion} ({ExpoApplication.nativeBuildVersion})</Text>
                {!permission.granted &&
                    <Button style={styles.text} title='Request Camera Permissions for Scanner' onPress={requestPermission}/>
                }
                {permission.granted &&
                    <Button style={styles.text} title='Open Scanner' onPress={() => router.push('/scanner')}/>
                }
                    {/* this is crashing android for some reason */}
                {Platform.OS === 'ios' && (
                    <LottieView
                        source={require('@/assets/spinning_star_eye.json')}
                        style={{width: "50%", height: "50%"}}
                        autoPlay
                        loop
                    />
                    )
                }
            </SafeAreaView>
        );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
        message: {
            textAlign: 'center',
            paddingBottom: 10,
        },
        camera: {
            flex: 1,
        },
        buttonContainer: {
            flex: 1,
            flexDirection: 'row',
            backgroundColor: 'blue',
            margin: 64,
        },
        button: {
            flex: 1,
            alignSelf: 'flex-end',
            alignItems: 'center',
        },
        text: {
            fontSize: 24,
            fontWeight: 'bold',
        }
});