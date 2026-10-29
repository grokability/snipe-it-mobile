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
                    headerTitle: t('general.components'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="licenses"
                options={{
                    title: t('general.licenses'),
                    headerTitle: t('general.licenses'),
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
                name="users/index"
                options={{
                    title: t('general.users'),
                    headerTitle: t('general.users'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="users/[id]"
                options={{
                    title: t('general.user'),
                    headerTitle: t('general.user'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="users/[id]/assets"
                options={{
                    title: t('general.assets'),
                    headerTitle: t('general.assets'),
                    headerBackTitle: '',
                }}
            />
            {/* Shared with the Assets tab through (assets,more), so items opened from here stay in this stack */}
            <Stack.Screen
                name="assets/[id]"
                options={{
                    title: t('mobile.screen_asset_details'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="assets/checkout/[id]"
                options={{
                    title: t('mobile.screen_checkout'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="assets/checkin/[id]"
                options={{
                    title: t('mobile.screen_checkin'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="assets/edit/[id]"
                options={{
                    title: t('mobile.screen_edit_asset'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="assets/create"
                options={{
                    title: t('mobile.screen_create_asset'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="accessories/[id]"
                options={{
                    title: t('mobile.screen_accessory_details'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="accessories/checkout/[id]"
                options={{
                    title: t('mobile.screen_checkout'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="accessories/checkin/[id]"
                options={{
                    title: t('mobile.screen_checkin'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="accessories/edit/[id]"
                options={{
                    title: t('mobile.screen_edit_accessory'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="consumables/[id]"
                options={{
                    title: t('mobile.screen_consumable_details'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="consumables/checkout/[id]"
                options={{
                    title: t('mobile.screen_checkout'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="consumables/edit/[id]"
                options={{
                    title: t('mobile.screen_edit_consumable'),
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
            <Stack.Screen
                name="help"
                options={{
                    title: t('mobile.help'),
                    headerBackTitle: '',
                }}
            />
        </Stack>
    );
}
