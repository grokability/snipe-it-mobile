import {Host, Picker} from "@expo/ui/swift-ui";
import {StyleSheet, View} from "react-native";
import ExpoDevice from "expo-device/src/ExpoDevice";


export function CheckoutPicker({ selectedCheckoutTo, setSelectedCheckoutTo, checkoutToOptions }) {
    const isIpad = ExpoDevice.osName === "iPadOS";
    const SPACE_SCALE = 1.33;


    return (
        <View
        style={{
            paddingVertical: isIpad ? Math.round(4 * SPACE_SCALE) : 4,
            backgroundColor: "#FFFFFF"
        }}
        >
            <Host matchContents>
                <Picker
                    options={checkoutToOptions}
                    selectedIndex={selectedCheckoutTo}
                    onOptionSelected={({nativeEvent: {index}}) => {
                        console.log(index);
                        setSelectedCheckoutTo(index);
                    }}
                    variant="segmented"
                    color={"#FFFFFF"}
                    elementColors={{
                        activeContainerColor: "blue",
                        activeContentColor: "white",
                        activeBorderColor: "transparent",
                        inactiveContainerColor: "#f1f1f1",
                        inactiveContentColor: "#606060",
                        inactiveBorderColor: "transparent",
                    }}
                    style={{
                        ...styles.picker,
                        // width: isIpad ? Math.round(24 * SPACE_SCALE) : 24 * 2,
                        width: 300,
                    }}
                />
            </Host>
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
