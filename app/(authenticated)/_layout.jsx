import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {Stack, useRouter} from "expo-router";
import { COLORS } from "@/constants/colors";

export default function AuthenticatedLayout() {
    const router = useRouter();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack
                screenOptions={({ navigation, route }) => {
                    // Get parent navigator state to check if we're in a nested stack
                    const state = navigation.getState();
                    const tabState = state?.routes?.find(r => r.name === '(tabs)')?.state;
                    const currentStack = tabState?.routes?.find(r => r.state?.index > 0);
                    const showBackButton = currentStack !== undefined;

                    return {
                        headerShown: true,
                        headerStyle: styles.header,
                        headerTintColor: COLORS.text,
                        headerTitleStyle: styles.headerTitle,
                        drawerStyle: styles.drawer,
                        drawerActiveBackgroundColor: '#e6e0f0',
                        drawerActiveTintColor: COLORS.primary,
                        drawerInactiveTintColor: COLORS.text,
                        headerLeft: () => {
                            // If we need to show a back button (we're in a stack with history)
                            if (showBackButton) {
                                return (
                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        style={{ marginLeft: 16 }}
                                    >
                                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                                    </TouchableOpacity>
                                );
                            }
                            // Otherwise show nothing
                            return null;
                        },
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => navigation.toggleDrawer()}
                                style={styles.headerButton}
                            >
                                <Ionicons name="menu" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        ),
                        drawerPosition: 'right',
                        drawerType: 'back',
                        drawerLabelStyle: styles.drawerLabel,
                    };
                }}
            >
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        title: 'Home',
                        drawerLabel: 'Home'
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
                        drawerItemStyle: { display: 'none' }
                    }}
                />
            </Stack>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.background,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerButton: {
        padding: 10,
        marginHorizontal: 6,
    },
    drawer: {
        backgroundColor: COLORS.background,
        width: 250,
    },
    drawerItem: {
        borderRadius: 8,
        marginHorizontal: 10,
        marginVertical: 4,
    },
    drawerLabel: {
        fontSize: 16,
        fontWeight: '500',
    }
});
