import { StyleSheet, View } from "react-native";
import {Stack} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import {useMemo} from "react";
import {useTranslation} from "react-i18next";

export default function AuthenticatedLayout() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    return (
        <Stack
                screenOptions={({ navigation, route }) => {
                    const routeName = getFocusedRouteNameFromRoute(route);
                    const hasOwnHeader = routeName === '(assets)' || routeName === '(accessories)' || routeName === '(consumables)' || routeName === 'audit' || routeName === '(more)';
                    return {
                        headerShown: !hasOwnHeader,
                        headerTransparent: true,
                        headerShadowVisible: false,
                        headerTitle: '',
                        headerStyle: styles.header,
                        headerTintColor: colors.text,
                        headerLeftContainerStyle: { paddingLeft: 16 },
                        headerRightContainerStyle: { paddingRight: 16 },
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
