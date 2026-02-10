import {Stack} from 'expo-router';
import TopNavMenu from "@/components/overlays/TopNavMenu";
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export default function AssetsLayout() {
    const colors = useColors();
    const { t } = useTranslation();

    return (
        <>
            <Stack screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                headerTitle: '',
                headerTintColor: colors.text,
                headerRight: () => <TopNavMenu />,
            }}
            >

                <Stack.Screen
                    name="index"
                    options={{
                        title: t('tabs.assets'),
                    }}
                />
                <Stack.Screen
                    name="[id]"
                    options={{
                        title: t('screens.assetDetails'),
                        headerBackTitle: '',
                    }}
                />
                <Stack.Screen
                    name="checkout/[id]"
                    options={{
                        title: t('screens.checkoutScreen'),
                        headerBackTitle: '',
                    }}
                    />
                <Stack.Screen
                    name="checkin/[id]"
                    options={{
                        title: t('screens.checkinScreen'),
                        headerBackTitle: '',
                    }}
                    />
            </Stack>

        </>

    );
}
