import { StyleSheet, View } from "react-native";
import {Stack} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import TopNavMenu from "@/components/overlays/TopNavMenu";
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import {useMemo} from "react";
import {useTranslation} from "react-i18next";

export default function AuthenticatedLayout() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    return (
        <View style={{ flex: 1 }}>
            <Stack
                screenOptions={({ navigation, route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route);
                    const hasOwnHeader = routeName === '(assets)' || routeName === '(accessories)' || routeName === 'audit';
                    return {
                        headerShown: !hasOwnHeader,
                        headerTransparent: true,
                        headerShadowVisible: false,
                        headerTitle: '',
                        headerStyle: styles.header,
                        headerTintColor: colors.text,
                        headerRight: () => (
                            <View style={{marginRight: 8}}>
                                <TopNavMenu />
                            </View>
                        ),
                    };
                }}
            >
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        title: t('general.dashboard'),
                        drawerLabel: t('general.dashboard'),
                    }}
                />
                <Stack.Screen
                    name="licenses"
                    options={{
                        drawerLabel: t('general.licenses'),
                        title: t('general.licenses'),
                    }}
                />
                <Stack.Screen
                    name="settings"
                    options={{
                        drawerLabel: t('general.settings'),
                        title: t('general.settings'),
                    }}
                />
                <Stack.Screen
                    name="audit"
                    options={{
                        headerShown: false,
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
