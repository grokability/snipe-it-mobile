import { Stack, router } from 'expo-router';
import { useAuth, AuthProvider } from "../context/AuthProvider";
import { ActivityIndicator, View } from "react-native";
import React, {useEffect} from "react";


export default function RootLayout() {

    return (
        <AuthProvider>
            <AuthLayoutContent/>
        </AuthProvider>
    )

    function AuthLayoutContent() {
        const {isAuthenticated, isLoading} = useAuth();
        console.log({isAuthenticated, isLoading});

        useEffect(() => {
            if (!isLoading) {
                if (isAuthenticated) {
                    console.log("User is authenticated. Navigating to: /(tabs)");
                    router.replace("/(tabs)"); // Navigate to tabs layout
                } else {
                    console.log("User is not authenticated. Navigating to: /login");
                    router.replace("/login"); // Navigate to login page
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

        if (isAuthenticated) {
            console.log("User is authenticated. Navigating to: /(tabs)");
            return (
                <Stack>
                    <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                </Stack>
            );
        } else {
            console.log("User is not authenticated. Navigating to: /login");
            return (
                <Stack>
                    <Stack.Screen name="login" options={{headerTitle: "Login"}}/>
                </Stack>
            );
        }
    }
}