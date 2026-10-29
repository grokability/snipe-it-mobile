import {Stack} from 'expo-router';
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export const unstable_settings = {
    anchor: 'index',
};

export default function AccessoriesLayout() {
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
                    title: t('general.accessories'),
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
        </Stack>
    );
}
