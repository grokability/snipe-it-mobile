import {Stack} from 'expo-router';
import {useStackHeaderOptions} from "@/hooks/useStackHeaderOptions";
import {useTranslation} from "react-i18next";

export default function HomeLayout() {
    const stackHeaderOptions = useStackHeaderOptions();
    const { t } = useTranslation();

    return (
        <Stack screenOptions={stackHeaderOptions}>
            <Stack.Screen
                name="index"
                options={{
                    title: t('general.dashboard'),
                }}
            />
        </Stack>
    );
}
