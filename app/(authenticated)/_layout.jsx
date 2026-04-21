import { StyleSheet } from "react-native";
import {Redirect, Stack} from "expo-router";
import {useColors} from "@/hooks/useThemeColors";
import {useMemo, useContext} from "react";
import {useTranslation} from "react-i18next";
import {AuthContext} from "@/context/AuthProvider";

export default function AuthenticatedLayout() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { isAuthenticated, isLoading } = useContext(AuthContext);

    if (!isLoading && !isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerTransparent: true,
                headerShadowVisible: false,
                headerTitle: '',
                headerStyle: styles.header,
                headerTintColor: colors.text,
                headerLeftContainerStyle: { paddingLeft: 16 },
                headerRightContainerStyle: { paddingRight: 16 },
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
});
