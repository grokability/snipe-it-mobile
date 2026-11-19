import {Stack} from "expo-router";
import {useStackHeaderOptions} from "@/hooks/useStackHeaderOptions";
import {useTranslation} from "react-i18next";
import {View} from "react-native";
import {StatusBarScrim} from "@/components/ui/FloatingHeader";

export default function AuthenticatedLayout() {
    const stackHeaderOptions = useStackHeaderOptions();
    const { t } = useTranslation();

    return (
        <View style={{flex: 1}}>
            <Stack
                screenOptions={{
                    ...stackHeaderOptions,
                    headerShown: false,
                }}
            >
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        title: t('general.dashboard'),
                        drawerLabel: t('general.dashboard'),
                    }}
                />
                <Stack.Screen
                    name="index"
                    options={{
                        drawerItemStyle: { display: 'none' },
                    }}
                />
            </Stack>
            <StatusBarScrim />
        </View>
    );
}
