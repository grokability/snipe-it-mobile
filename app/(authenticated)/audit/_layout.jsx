import {Stack, useRouter} from 'expo-router';
import {TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import TopNavMenu from "@/components/overlays/TopNavMenu";
import {useColors} from "@/hooks/useThemeColors";
import {useTranslation} from "react-i18next";

export default function AuditLayout() {
    const colors = useColors();
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <Stack screenOptions={{
            headerShown: true,
            headerTransparent: true,
            headerShadowVisible: false,
            headerTitle: '',
            headerTintColor: colors.text,
            headerRight: () => <TopNavMenu />,
        }}>
            <Stack.Screen
                name="index"
                options={{
                    title: t('mobile.screen_audit_dashboard'),
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                            <Ionicons name="chevron-back" size={28} color={colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen
                name="confirm"
                options={{
                    title: t('mobile.screen_audit_confirm'),
                    headerBackTitle: '',
                }}
            />
        </Stack>
    );
}
