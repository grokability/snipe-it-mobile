import {Text} from "react-native";


export function CheckoutPicker() {
    const checkoutToOptions = [
        { label: 'User', value: 'user' },
        { label: 'Location', value: 'location' },
        { label: 'Asset', value: 'asset' },
    ];
    return (
        <Text>Non iOS Checkout Picker</Text>
    )
}
