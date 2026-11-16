import {Stack} from 'expo-router';
import {useStackHeaderOptions} from "@/hooks/useStackHeaderOptions";
import {useTranslation} from "react-i18next";

export const unstable_settings = {
    anchor: 'index',
};

export default function ConsumablesLayout() {
    const stackHeaderOptions = useStackHeaderOptions();
    const { t } = useTranslation();

    return (
        <Stack screenOptions={stackHeaderOptions}>
            <Stack.Screen
                name="index"
                options={{
                    title: t('general.consumables'),
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
