import { Stack, router } from 'expo-router';
import { useAuth, AuthProvider } from "@/context/AuthProvider";
import { AuditSessionProvider } from "@/context/AuditSessionProvider";
import { PermissionProvider } from "@/permissions/PermissionContext";
import { ActivityIndicator, AppState, View } from "react-native";
import React, {useEffect} from "react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {QueryClientProvider, onlineManager, focusManager} from "@tanstack/react-query";
import {useReactQueryDevTools} from "@dev-plugins/react-query";
import * as Network from "expo-network";
import {queryClient} from "@/helpers/queryClient";
import i18n from "@/i18n"; //this says unused but it's just providing for the entire app

onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
        setOnline(!!state.isConnected);
    });
    Network.getNetworkStateAsync().then((state) => setOnline(!!state.isConnected));
    return () => subscription.remove();
});

AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
});

export default function RootLayout() {
    useReactQueryDevTools(queryClient);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PermissionProvider>
                    <AuditSessionProvider>
                        <SafeAreaProvider>
                            <GestureHandlerRootView style={{ flex: 1 }}>
                                    <AuthLayoutContent/>
                            </GestureHandlerRootView>
                        </SafeAreaProvider>
                    </AuditSessionProvider>
                </PermissionProvider>
            </AuthProvider>
        </QueryClientProvider>
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
        );
    }
}