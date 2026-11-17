import {Stack} from 'expo-router';
import {useStackHeaderOptions} from "@/hooks/useStackHeaderOptions";
import {useTranslation} from "react-i18next";

export const unstable_settings = {
    anchor: 'index',
};

export default function UsersLayout() {
    const stackHeaderOptions = useStackHeaderOptions();
    const { t } = useTranslation();

    return (
        <Stack screenOptions={stackHeaderOptions}>
            <Stack.Screen
                name="index"
                options={{
                    title: t('general.users'),
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
            <Stack.Screen
                name="users/[id]/licenses"
                options={{
                    title: t('general.licenses'),
                    headerTitle: t('general.licenses'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="users/[id]/accessories"
                options={{
                    title: t('general.accessories'),
                    headerTitle: t('general.accessories'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="users/[id]/consumables"
                options={{
                    title: t('general.consumables'),
                    headerTitle: t('general.consumables'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="users/[id]/history"
                options={{
                    title: t('general.history'),
                    headerTitle: t('general.history'),
                    headerBackTitle: '',
                }}
            />
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
        </Stack>
    );
}
