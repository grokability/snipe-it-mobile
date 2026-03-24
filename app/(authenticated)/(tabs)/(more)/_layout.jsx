import {Stack} from 'expo-router';
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export default function MoreLayout() {
    const colors = useColors();
    const { t } = useTranslation();

    return (
        <Stack screenOptions={{
            headerShown: true,
            headerTransparent: true,
            headerShadowVisible: false,
            headerTitle: '',
            headerTintColor: colors.text,
        }}>
            <Stack.Screen
                name="index"
                options={{
                    title: t('mobile.more'),
                    headerTransparent: false,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                }}
            />
            <Stack.Screen
                name="components"
                options={{
                    title: t('general.components'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="licenses"
                options={{
                    title: t('general.licenses'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="settings"
                options={{
                    title: t('general.settings'),
                    headerBackTitle: '',
                }}
            />
        </Stack>
    );
}
