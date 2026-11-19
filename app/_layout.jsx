import { Stack } from 'expo-router';
import { getFocusedRouteNameFromRoute } from 'expo-router/react-navigation';
import { useAuth, AuthProvider } from "@/context/AuthProvider";
import { AuditSessionProvider } from "@/context/AuditSessionProvider";
import { PermissionProvider } from "@/permissions/PermissionContext";
import { ActivityIndicator, AppState, View } from "react-native";
import React from "react";
import {StatusBar} from "expo-status-bar";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {QueryClientProvider, onlineManager, focusManager} from "@tanstack/react-query";
import {useReactQueryDevTools} from "@dev-plugins/react-query";
import * as Network from "expo-network";
import {queryClient} from "@/helpers/queryClient";
import i18n from "@/i18n"; //this says unused but it's just providing for the entire app
import * as Sentry from "@sentry/react-native";
import {initSentry} from "@/helpers/sentry";
import ErrorReportConsentPrompt from "@/components/errorReporting/ErrorReportConsentPrompt";

// Runs at module scope so the global error handler is installed before any provider mounts.
initSentry();

// addNetworkStateListener emits the current path as soon as it subscribes, so it is the
// only signal we need. getNetworkStateAsync is deliberately not used to seed this: on iOS it
// waits on a throwaway NWPathMonitor and resolves with isConnected false on a 5s timeout
// rather than rejecting, which would mark us offline and leave every query paused with no
// error. isConnected is optional in NetworkState, so only an explicit false counts as offline.
onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
        setOnline(state.isConnected !== false);
    });
    return () => subscription.remove();
});

AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
});

// The camera can sit at half or full height. An item opened inside the sheet (iOS) gets full height
// only. react-native-screens names detents by position, so the full-height detent of [1.0] and
// the half-height one of [0.5, 1.0] share an identifier, and going back to the camera returns
// the sheet to half height.
function scannerSheetDetents(route) {
    const focusedScreen = getFocusedRouteNameFromRoute(route) ?? 'index';

    return focusedScreen === 'index' ? [0.5, 1.0] : [1.0];
}

function RootLayout() {
    useReactQueryDevTools(queryClient);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PermissionProvider>
                    <AuditSessionProvider>
                        <SafeAreaProvider>
                            <GestureHandlerRootView style={{ flex: 1 }}>
                                    <AuthLayoutContent/>
                                    <ErrorReportConsentPrompt/>
                                    <StatusBar style="auto"/>
                            </GestureHandlerRootView>
                        </SafeAreaProvider>
                    </AuditSessionProvider>
                </PermissionProvider>
            </AuthProvider>
        </QueryClientProvider>
    )

    function AuthLayoutContent() {
        const {isAuthenticated, isLoading} = useAuth();

        // Show a loading spinner until the authentication state is resolved
        if (isLoading) {
            return (
                <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                    <ActivityIndicator size="large" color="purple"/>
                </View>
            );
        }

        // Without redirectTo, a failed guard falls back to the first unguarded route in sort
        // order, which at the root can be an unrelated screen such as scanner.
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={isAuthenticated} redirectTo="/login">
                    <Stack.Screen name="(authenticated)" />
                    <Stack.Screen
                        name="scanner"
                        options={({ route }) => ({
                            presentation: 'formSheet',
                            sheetAllowedDetents: scannerSheetDetents(route),
                            sheetGrabberVisible: true,
                            contentStyle: { backgroundColor: 'black' },
                        })}
                    />
                </Stack.Protected>
                <Stack.Protected guard={!isAuthenticated} redirectTo="/">
                    <Stack.Screen
                        name="login"
                        options={{
                            headerShown: true,
                            headerTitle: "Login"
                        }}
                    />
                </Stack.Protected>
            </Stack>
        );
    }
}

export default Sentry.wrap(RootLayout);
