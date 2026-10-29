import {Stack} from 'expo-router';
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export const unstable_settings = {
    anchor: 'index',
};

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
            headerLeftContainerStyle: { paddingLeft: 16 },
            headerRightContainerStyle: { paddingRight: 16 },
        }}>

                <Stack.Screen
                    name="index"
                    options={{
                        title: t('general.assets'),
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
        </Stack>
    );
}
