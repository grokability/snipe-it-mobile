import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Button} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import {Link, router} from "expo-router";
import React, {useContext, useEffect, useMemo, useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import Constants from "expo-constants/src/Constants";
import ExpoApplication from "expo-application/src/ExpoApplication";
import RecentActions from "@/components/RecentActions";
import {AuthContext} from "@/context/AuthProvider";
import {useTranslation} from "react-i18next";
import {useColors} from "@/hooks/useThemeColors";
import {Typography, FontWeight} from "@/constants/sizes";

export default function HomeScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { user } = useContext(AuthContext);
    // kind of weird that you have to type it but it's still just a string?
    const [permission, requestPermission] = useCameraPermissions();
    useEffect(() => {
        console.log(permission);

        console.log(permission?.granted);
    })
    const { t } = useTranslation();



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

                {user?.permissions?.superuser === 1 && (
                    <RecentActions />
                )}
                    <Text style={styles.text}>{t('home.welcome')}</Text>
                    <Text style={styles.text}>{t('common.version', { version: ExpoApplication.nativeApplicationVersion, build: ExpoApplication.nativeBuildVersion })}</Text>
                {!permission.granted &&
                    <Button style={styles.text} title={t('home.requestCameraPermissions')} onPress={requestPermission}/>
                }
                {permission.granted &&
                    <Button style={styles.text} title={t('home.openScanner')} onPress={() => router.push('/scanner')}/>
                }
                <LottieView
                    source={require('@/assets/spinning_star_eye.json')}
                    style={{width: "50%", height: "50%"}}
                    autoPlay
                    loop
                />
            </SafeAreaView>
        );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
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
            fontSize: Typography.titleLarge,
            fontWeight: FontWeight.bold,
            color: colors.text,
        }
});
