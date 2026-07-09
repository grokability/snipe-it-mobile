import { Stack, router } from 'expo-router';
import { useAuth, AuthProvider } from "@/context/AuthProvider";
import { AuditSessionProvider } from "@/context/AuditSessionProvider";
import { PermissionProvider } from "@/permissions/PermissionContext";
import { ActivityIndicator, View } from "react-native";
import React, {useEffect} from "react";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {SafeAreaProvider} from "react-native-safe-area-context";
import i18n from "@/i18n"; //this says unused but it's just providing for the entire app


export default function RootLayout() {

    return (
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