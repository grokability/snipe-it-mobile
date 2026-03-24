import {Stack} from 'expo-router';
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export default function AssetsLayout() {
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
                        title: t('general.assets'),
                    }}
                />
                <Stack.Screen
                    name="[id]"
                    options={{
                        title: t('mobile.screen_asset_details'),
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
                    name="checkin/[id]"
                    options={{
                        title: t('mobile.screen_checkin'),
                        headerBackTitle: '',
                    }}
                    />
                <Stack.Screen
                    name="edit/[id]"
                    options={{
                        title: t('mobile.screen_edit_asset'),
                        headerBackTitle: '',
                    }}
                    />
                <Stack.Screen
                    name="create"
                    options={{
                        title: t('mobile.screen_create_asset'),
                        headerBackTitle: '',
                    }}
                    />
        </Stack>
    );
}
