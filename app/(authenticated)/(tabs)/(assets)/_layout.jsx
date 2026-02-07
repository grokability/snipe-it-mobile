import {Stack} from 'expo-router';
import TopNavMenu from "@/components/overlays/TopNavMenu";
import {Colors} from "@/constants/colors";

export default function AssetsLayout() {
    return (
        <>
            <Stack screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                headerTitle: '',
                headerTintColor: Colors.light.text,
                headerRight: () => <TopNavMenu />,
            }}
            >

                <Stack.Screen
                    name="index"
                    options={{
                        title: 'Assets',
                    }}
                />
                <Stack.Screen
                    name="[id]"
                    options={{
                        title: 'Asset Details',
                        headerBackTitle: '',
                    }}
                />
                <Stack.Screen
                    name="checkout/[id]"
                    options={{
                        title: 'Checkout Screen',
                        headerBackTitle: '',
                    }}
                    />
                <Stack.Screen
                    name="checkin/[id]"
                    options={{
                        title: 'Checkin Screen',
                        headerBackTitle: '',
                    }}
                    />
            </Stack>

        </>

    );
}
