import {Stack} from "expo-router";
import {useStackHeaderOptions} from "@/hooks/useStackHeaderOptions";
import {useTranslation} from "react-i18next";

export default function AuthenticatedLayout() {
    const stackHeaderOptions = useStackHeaderOptions();
    const { t } = useTranslation();

    return (
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
    );
}
