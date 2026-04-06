import {Stack} from 'expo-router';
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export default function ConsumablesLayout() {
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
                    title: t('general.consumables'),
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: t('mobile.screen_consumable_details'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="checkout/[id]"
                options={{
                    title: t('mobile.screen_checkout'),
                    headerBackTitle: '',
                }}
            />
            <Stack.Screen
                name="edit/[id]"
                options={{
                    title: t('mobile.screen_edit_consumable'),
                    headerBackTitle: '',
                }}
            />
        </Stack>
    );
}
