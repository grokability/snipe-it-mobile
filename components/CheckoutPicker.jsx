import {Picker} from "@expo/ui/jetpack-compose";
import {StyleSheet, View} from "react-native";
import ExpoDevice from "expo-device/src/ExpoDevice";
import {value} from "lodash/seq";
import {indexOf} from "lodash";


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
                backgroundColor: "#f1f1f1"
            }}
        >
                <Picker
                    options={options.map(option => option.label)}
                    selectedIndex={indexOf(options, options.find(option => option.value === selectedCheckoutTo))}
                    onOptionSelected={({nativeEvent: {index}}) => {
                        setSelectedCheckoutTo(options[index].value);
                    }}
                    variant="segmented"
                    color={"#606060"}
                    elementColors={{
                        activeContainerColor: "blue",
                        activeContentColor: "#f1f1f1",
                        activeBorderColor: "transparent",
                        inactiveContainerColor: "#f1f1f1",
                        inactiveContentColor: "#606060",
                        inactiveBorderColor: "#f1f1f1",
                    }}
                    style={{
                        ...styles.picker,
                        // width: isIpad ? Math.round(24 * SPACE_SCALE) : 24 * 2,
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
