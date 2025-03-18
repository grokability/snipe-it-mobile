import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";

export default function AuthenticatedLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                screenOptions={({ navigation }) => ({
                    headerShown: true, // Show the header
                    headerLeft: () => null,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.toggleDrawer()}
                            style={{ marginRight: 16 }}
                        >
                            <Ionicons name="menu" size={24} color="black" />
                        </TouchableOpacity>
                    ),
                    drawerPosition: 'right',
                    // drawerType: 'back',
                })}
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