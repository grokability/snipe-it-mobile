import { Camera, CameraView } from "expo-camera";
import {Link, router, Stack} from "expo-router";
import {
    AppState,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
} from "react-native";
import { useEffect, useRef } from "react";
import * as Haptics from 'expo-haptics';

export default function Home() {
    const qrLock = useRef(false);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                qrLock.current = false;
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <SafeAreaView style={StyleSheet.absoluteFillObject}>
            <Stack.Screen
                options={{
                    title: "Overview",
                    headerShown: false,
                }}
            />
            {Platform.OS === "android" ? <StatusBar hidden /> : null}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={({ data }) => {
                    if (data && !qrLock.current) {
                        const parsedUrl = new URL(data);
                        const segments = parsedUrl.pathname.split("/");
                        const id = segments[segments.length - 1];
                        qrLock.current = true;
                        // router.push(`(tabs)/(assets)/${id}`);
                        setTimeout(async () => {
                            console.log(id);
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                             await router.replace(`(tabs)/(assets)/${id}`);
                        }, 500);
                    }
                }}
            />
        </SafeAreaView>
    );
}