import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRouter } from "expo-router";

export default function AuthenticatedLayout() {
    const router = useRouter();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                screenOptions={({ navigation, route }) => {
                    // Get parent navigator state to check if we're in a nested stack
                    const state = navigation.getState();
                    const tabState = state?.routes?.find(r => r.name === '(tabs)')?.state;
                    const currentStack = tabState?.routes?.find(r => r.state?.index > 0);
                    const showBackButton = currentStack !== undefined;

                    return {
                        headerShown: true,
                        headerLeft: () => {
                            // If we need to show a back button (we're in a stack with history)
                            if (showBackButton) {
                                return (
                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        style={{ marginLeft: 16 }}
                                    >
                                        <Ionicons name="arrow-back" size={24} color="black" />
                                    </TouchableOpacity>
                                );
                            }
                            // Otherwise show nothing
                            return null;
                        },
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => navigation.toggleDrawer()}
                                style={{ marginRight: 16 }}
                            >
                                <Ionicons name="menu" size={24} color="black" />
                            </TouchableOpacity>
                        ),
                        drawerPosition: 'right',
                        drawerType: 'back',
                        // Hide index routes from the drawer
                        drawerItemStyle: route.name === "index" ? { display: 'none' } : undefined,
                    };
                }}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                        title: 'Home',
                        drawerLabel: 'Home'
                    }}
                />
                <Drawer.Screen
                    name="licenses"
                    options={{
                        drawerLabel: 'Licenses',
                        title: 'Licenses',
                    }}
                />
                <Drawer.Screen
                    name="settings"
                    options={{
                        drawerLabel: 'Settings',
                        title: 'Settings',
                    }}
                />
            {/*  hidden screens  */}
                <Drawer.Screen
                    name="index"
                    options={{
                        // This explicitly hides the index route from the drawer
                        drawerItemStyle: { display: 'none' }
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
}