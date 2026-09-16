import {Host, SegmentedButton, SingleChoiceSegmentedButtonRow, Text} from "@expo/ui/jetpack-compose";
import {fillMaxWidth, weight} from "@expo/ui/jetpack-compose/modifiers";
import {StyleSheet, View} from "react-native";
import ExpoDevice from "expo-device/src/ExpoDevice";
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
            <Host style={styles.host}>
                <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                    {options.map(option => (
                        <SegmentedButton
                            key={option.value}
                            selected={option.value === selectedCheckoutTo}
                            onClick={() => setSelectedCheckoutTo(option.value)}
                            modifiers={[weight(1)]}
                            colors={{
                                activeContainerColor: colors.primary,
                                activeContentColor: colors.background,
                                activeBorderColor: "transparent",
                                inactiveContainerColor: colors.backgroundTertiary,
                                inactiveContentColor: colors.textSecondary,
                                inactiveBorderColor: colors.backgroundTertiary,
                            }}
                        >
                            <SegmentedButton.Label>
                                <Text>{option.label}</Text>
                            </SegmentedButton.Label>
                        </SegmentedButton>
                    ))}
                </SingleChoiceSegmentedButtonRow>
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
    host: {
        alignSelf: "center",
        width: 300,
        height: 40,
        paddingVertical: isIpad ? Math.round(24 * SPACE_SCALE) : 24,
    },
});
