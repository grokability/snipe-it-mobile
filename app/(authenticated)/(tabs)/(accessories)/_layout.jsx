import {View} from 'react-native';
import {Stack} from 'expo-router';
import TopNavMenu from "@/components/overlays/TopNavMenu";
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

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
            headerRight: () => (
                <View style={{marginRight: 8}}>
                    <TopNavMenu />
                </View>
            ),
        }}>
            <Stack.Screen
                name="index"
                options={{
                    title: t('general.accessories'),
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: t('mobile.screen_accessory_details'),
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
                    title: t('mobile.screen_edit_accessory'),
                    headerBackTitle: '',
                }}
            />
        </Stack>
    );
}
