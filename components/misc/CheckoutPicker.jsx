import {Picker, Host} from "@expo/ui/jetpack-compose";
import {StyleSheet, View} from "react-native";
import ExpoDevice from "expo-device/src/ExpoDevice";
import {indexOf} from "lodash";
import {useColors} from "@/hooks/useThemeColors";

export function CheckoutPicker({ selectedCheckoutTo, setSelectedCheckoutTo }) {
    const colors = useColors();
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
            <Host matchContents>
                <Picker
                    options={options.map(option => option.label)}
                    selectedIndex={indexOf(options, options.find(option => option.value === selectedCheckoutTo))}
                    onOptionSelected={({nativeEvent: {index}}) => {
                        setSelectedCheckoutTo(options[index].value);
                    }}
                    variant="segmented"
                    color={colors.textSecondary}
                    elementColors={{
                        activeContainerColor: colors.primary,
                        activeContentColor: colors.background,
                        activeBorderColor: "transparent",
                        inactiveContainerColor: colors.backgroundTertiary,
                        inactiveContentColor: colors.textSecondary,
                        inactiveBorderColor: colors.backgroundTertiary,
                    }}
                    style={{
                        ...styles.picker,
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
