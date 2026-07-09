import {Host, SegmentedButton, SingleChoiceSegmentedButtonRow, Text} from "@expo/ui/jetpack-compose";
import {fillMaxWidth, weight} from "@expo/ui/jetpack-compose/modifiers";
import {StyleSheet, View} from "react-native";
import {useColors} from "@/hooks/useThemeColors";

export function SegmentedPicker({options, selectedValue, onValueChange}) {
    const colors = useColors();

    return (
        <View style={styles.container}>
            <Host style={styles.host}>
                <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
                    {options.map(option => (
                        <SegmentedButton
                            key={option.value}
                            selected={option.value === selectedValue}
                            onClick={() => onValueChange(option.value)}
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
});
