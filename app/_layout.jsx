import { Stack, router } from 'expo-router';
import { useAuth, AuthProvider } from "@/context/AuthProvider";
import { ActivityIndicator, View } from "react-native";
import React, {useEffect} from "react";
import {Drawer} from "expo-router/drawer";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {BottomSheetModalProvider} from "@gorhom/bottom-sheet";


export default function RootLayout() {

    return (
        <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <AuthLayoutContent/>
            </GestureHandlerRootView>
        </AuthProvider>
    )

    function AuthLayoutContent() {
        const {isAuthenticated, isLoading} = useAuth();
        console.log({isAuthenticated, isLoading});

        useEffect(() => {
            if (!isLoading) {
                if (isAuthenticated) {
                    console.log("User is authenticated. Navigating to: /(tabs)");
                    router.replace("/(authenticated)/");
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

        // if (isAuthenticated) {
        //     console.log("User is authenticated. Navigating to: /(tabs)");
        //     return (
        //         <Stack.Screen name="(authenticated)" options={{headerShown: false}}/>
        //         // <Stack>
        //         //     <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
        //         // </Stack>
        //     );
        // } else {
        //     console.log("User is not authenticated. Navigating to: /login");
        //     return (
        //         // <Stack>
        //             <Stack.Screen name="login" options={{headerTitle: "Login"}}/>
        //         // </Stack>
        //     );
        // }
    }
}