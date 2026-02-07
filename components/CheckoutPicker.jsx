import {Picker} from "@expo/ui/jetpack-compose";
import {StyleSheet, View} from "react-native";
import ExpoDevice from "expo-device/src/ExpoDevice";
import {value} from "lodash/seq";
import {indexOf} from "lodash";
import {Colors} from "@/constants/colors";
import {Spacing} from "@/constants/sizes";


export function CheckoutPicker({ selectedCheckoutTo, setSelectedCheckoutTo }) {
    const isIpad = ExpoDevice.osName === "iPadOS";
    const SPACE_SCALE = 1.33;

    const options = [
        {label: "User", value: "user"},
        {label: "Location", value: "location"},
        {label: "Asset", value: "asset"}
    ];

    return (
        <View
            style={{
                paddingVertical: isIpad ? Math.round(4 * SPACE_SCALE) : 4,
            }}
        >
                <Picker
                    options={options.map(option => option.label)}
                    selectedIndex={indexOf(options, options.find(option => option.value === selectedCheckoutTo))}
                    onOptionSelected={({nativeEvent: {index}}) => {
                        setSelectedCheckoutTo(options[index].value);
                    }}
                    variant="segmented"
                    color={Colors.light.textSecondary}
                    elementColors={{
                        activeContainerColor: Colors.light.primary,
                        activeContentColor: Colors.light.background,
                        activeBorderColor: "transparent",
                        inactiveContainerColor: Colors.light.backgroundTertiary,
                        inactiveContentColor: Colors.light.textSecondary,
                        inactiveBorderColor: Colors.light.backgroundTertiary,
                    }}
                    style={{
                        ...styles.picker,
                        width: 300,
                    }}
                />
        </View>
    )
}
const isIpad = ExpoDevice.osName === "iPadOS";

const SPACE_SCALE = 1.33;
const styles = StyleSheet.create({
    overlay: {
        height: 50,
        position: "absolute",
        width: "100%",
    },
    picker: {
        alignSelf: "center",
        height: 40,
        paddingVertical: isIpad ? Math.round(24 * SPACE_SCALE) : 24,
    },
});
