import {Stack} from 'expo-router';

export default function AssetsLayout() {
    return (
        <Stack>
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
                    headerBackTitle: 'Back',
                }}
            />
            <Stack.Screen
                name="checkout/[id]"
                options={{
                    title: 'Checkout Screen',
                }}
                />
            <Stack.Screen
                name="checkin/[id]"
                options={{
                    title: 'Checkin Screen',
                }}
                />
        </Stack>
    );
}
