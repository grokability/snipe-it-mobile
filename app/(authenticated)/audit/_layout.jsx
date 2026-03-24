import {Stack, useRouter} from 'expo-router';
import {TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
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
            <Stack.Screen
                name="session"
                options={{
                    title: t('mobile.screen_audit_session'),
                    headerBackTitle: '',
                }}
            />
        </Stack>
    );
}
