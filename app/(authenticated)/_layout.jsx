import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {Stack, useRouter} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {SafeAreaView} from "react-native-safe-area-context";
import TopNavMenu from "@/components/overlays/TopNavMenu";
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import {useMemo} from "react";

export default function AuthenticatedLayout() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
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
                        headerTintColor: colors.text,
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

const createStyles = (colors) => StyleSheet.create({
    header: {
        backgroundColor: colors.background,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    headerButton: {
        padding: Spacing.md,
        marginHorizontal: 6,
    },
    drawer: {
        backgroundColor: colors.background,
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
