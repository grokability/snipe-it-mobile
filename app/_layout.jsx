import { Stack, router } from 'expo-router';
import { useAuth, AuthProvider } from "@/context/AuthProvider";
import { ActivityIndicator, View } from "react-native";
import React, {useEffect} from "react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";
import i18n from "@/i18n";
import {SafeAreaProvider} from "react-native-safe-area-context";


export default function RootLayout() {

    return (
        <AuthProvider>
            <SafeAreaProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                        <AuthLayoutContent/>
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </AuthProvider>
    )

    function AuthLayoutContent() {
        const {isAuthenticated, isLoading} = useAuth();

        useEffect(() => {
            if (!isLoading) {
                if (isAuthenticated) {
                    router.replace("/(authenticated)/");
                } else {
                    router.replace("/login");
                }
            }
        }, [isAuthenticated, isLoading]);

        // Show a loading spinner until the authentication state is resolved
        if (isLoading) {
            return (
                <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                    <ActivityIndicator size="large" color="purple"/>
                </View>
            );
        }

        return (
            <BottomSheetModalProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    {isAuthenticated ? (
                        <Stack.Screen name="(authenticated)" />
                    ) : (
                        <Stack.Screen
                            name="login"
                            options={{
                                headerShown: true,
                                headerTitle: "Login"
                            }}
                        />
                    )}
                </Stack>
            </BottomSheetModalProvider>
        );
    }
}