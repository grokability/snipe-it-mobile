import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {Stack, useRouter} from "expo-router";
import { Colors } from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {SafeAreaView} from "react-native-safe-area-context";
import TopNavMenu from "@/components/overlays/TopNavMenu";
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

export default function AuthenticatedLayout() {

    // Hide the header if we are in the (assets) stack
    // This prevents the "double header" look


    return (
        // mine
        <View style={{ flex: 1 }}>
            <Stack
                screenOptions={({ navigation, route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route);
                    const isAssetsStack = routeName === '(assets)';
                    return {
                        headerShown: !isAssetsStack,
                        headerTransparent: true,
                        headerShadowVisible: false,
                        headerTitle: '',
                        headerStyle: styles.header,
                        headerRight: () => <TopNavMenu />,
                    };
                }}
            >
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        title: 'Home',
                        drawerLabel: 'Home',
                    }}
                />
                <Stack.Screen
                    name="licenses"
                    options={{
                        drawerLabel: 'Licenses',
                        title: 'Licenses',
                    }}
                />
                <Stack.Screen
                    name="settings"
                    options={{
                        drawerLabel: 'Settings',
                        title: 'Settings',
                    }}
                />
            {/*  hidden screens  */}
                <Stack.Screen
                    name="index"
                    options={{
                        drawerItemStyle: { display: 'none' },
                    }}
                />
            </Stack>

            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.light.background,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: Colors.light.text,
    },
    headerButton: {
        padding: Spacing.md,
        marginHorizontal: 6,
    },
    drawer: {
        backgroundColor: Colors.light.background,
        width: 250,
    },
    drawerItem: {
        borderRadius: BorderRadius.sm,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.xs,
    },
    drawerLabel: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
    }
});
