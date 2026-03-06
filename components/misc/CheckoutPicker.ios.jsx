import {Host, Picker, Text} from "@expo/ui/swift-ui";
import {pickerStyle, tag} from "@expo/ui/swift-ui/modifiers";
import {StyleSheet, View} from "react-native";
import ExpoDevice from "expo-device/src/ExpoDevice";

const options = [
    {label: "User", value: "user"},
    {label: "Location", value: "location"},
    {label: "Asset", value: "asset"}
];

export function CheckoutPicker({ selectedCheckoutTo, setSelectedCheckoutTo }) {
    const isIpad = ExpoDevice.osName === "iPadOS";
    const SPACE_SCALE = 1.33;

    return (
        <View
            style={{
                paddingVertical: isIpad ? Math.round(4 * SPACE_SCALE) : 4,
            }}
        >
            <Host matchContents>
                <Picker
                    selection={selectedCheckoutTo}
                    onSelectionChange={(value) => setSelectedCheckoutTo(value)}
                    modifiers={[pickerStyle('segmented')]}
                    style={{
                        ...styles.picker,
                        width: 300,
                    }}
                >
                    {options.map(option => (
                        <Text key={option.value} modifiers={[tag(option.value)]}>
                            {option.label}
                        </Text>
                    ))}
                </Picker>
            </Host>
        </View>
    );
}

const isIpad = ExpoDevice.osName === "iPadOS";
const SPACE_SCALE = 1.33;

const styles = StyleSheet.create({
    picker: {
        alignSelf: "center",
        height: 40,
        paddingVertical: isIpad ? Math.round(24 * SPACE_SCALE) : 24,
    },
});
