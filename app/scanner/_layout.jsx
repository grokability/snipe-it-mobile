import {Stack} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {useStackHeaderOptions} from '@/hooks/useStackHeaderOptions';

export default function ScannerSheetLayout() {
    const stackHeaderOptions = useStackHeaderOptions();
    const {t} = useTranslation();

    const itemScreens = [
        {name: 'assets/[id]', title: t('mobile.screen_asset_details')},
        {name: 'assets/edit/[id]', title: t('mobile.screen_edit_asset')},
        {name: 'assets/checkout/[id]', title: t('mobile.screen_checkout')},
        {name: 'assets/checkin/[id]', title: t('mobile.screen_checkin')},
        {name: 'accessories/[id]', title: t('mobile.screen_accessory_details')},
        {name: 'accessories/edit/[id]', title: t('mobile.screen_edit_accessory')},
        {name: 'accessories/checkout/[id]', title: t('mobile.screen_checkout')},
        {name: 'accessories/checkin/[id]', title: t('mobile.screen_checkin')},
        {name: 'consumables/[id]', title: t('mobile.screen_consumable_details')},
        {name: 'consumables/edit/[id]', title: t('mobile.screen_edit_consumable')},
        {name: 'consumables/checkout/[id]', title: t('mobile.screen_checkout')},
    ];

    return (
        <Stack screenOptions={stackHeaderOptions}>
            <Stack.Screen name="index" options={{headerShown: false}} />
            {itemScreens.map((itemScreen) => (
                <Stack.Screen
                    key={itemScreen.name}
                    name={itemScreen.name}
                    options={{title: itemScreen.title, headerBackTitle: ''}}
                />
            ))}
        </Stack>
    );
}
