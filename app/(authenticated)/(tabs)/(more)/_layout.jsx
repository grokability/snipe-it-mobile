import {Stack} from 'expo-router';
import {useStackHeaderOptions} from "@/hooks/useStackHeaderOptions";
import {useTranslation} from "react-i18next";

export default function MoreLayout() {
    const stackHeaderOptions = useStackHeaderOptions();
    const { t } = useTranslation();

    return (
        <Stack screenOptions={stackHeaderOptions}>
            <Stack.Screen
                name="index"
                options={{
                    title: t('mobile.more'),
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
                }}
            />
            <Stack.Screen
                name="consumables"
                options={{
                    title: t('general.consumables'),
                    headerTitle: t('general.consumables'),
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
