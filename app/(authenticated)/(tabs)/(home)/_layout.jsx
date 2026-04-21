import {Stack} from 'expo-router';
import {useColors} from "@/hooks/useThemeColors";

export default function HomeLayout() {
    const colors = useColors();

    return (
        <Stack screenOptions={{
            headerShown: true,
            headerTransparent: true,
            headerShadowVisible: false,
            headerTitle: '',
            headerTintColor: colors.text,
            headerLeftContainerStyle: { paddingLeft: 16 },
            headerRightContainerStyle: { paddingRight: 16 },
        }} />
    );
}
