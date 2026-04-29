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
            headerLeftContainerStyle: { paddingLeft: 16 },
            headerRightContainerStyle: { paddingRight: 16 },
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
                name="reports/activity-report/index"
                options={{
                    headerTitle: t('general.activity_report'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="reports/activity-report/[id]"
                options={{
                    headerTitle: '',
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="reports/index"
                options={{
                    headerTitle: t('general.reports'),
                    headerBackTitle: '',
                    headerTransparent: false,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
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
