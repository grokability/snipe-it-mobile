import {Picker, Host} from "@expo/ui/jetpack-compose";
import {StyleSheet, View} from "react-native";
import {indexOf} from "lodash";
import {useColors} from "@/hooks/useThemeColors";

export function SegmentedPicker({options, selectedValue, onValueChange}) {
    const colors = useColors();

    return (
        <View style={styles.container}>
            <Host style={styles.host}>
                <Picker
                    options={options.map(option => option.label)}
                    selectedIndex={indexOf(options, options.find(option => option.value === selectedValue))}
                    onOptionSelected={({nativeEvent: {index}}) => {
                        onValueChange(options[index].value);
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
                    style={styles.picker}
                />
            </Host>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 4,
    },
    host: {
        width: "100%",
        height: 48,
    },
    picker: {
        width: "100%",
        height: 48,
    },
});
