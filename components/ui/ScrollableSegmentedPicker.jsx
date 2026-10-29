import {Host, SegmentedButton, SingleChoiceSegmentedButtonRow, Text} from "@expo/ui/jetpack-compose";
import {horizontalScroll, padding} from "@expo/ui/jetpack-compose/modifiers";
import {StyleSheet, View} from "react-native";
import {useColors} from "@/hooks/useThemeColors";

// A segmented picker for more segments than fit across the screen: it keeps its natural width
// and scrolls sideways. `bleed` is the parent's horizontal padding; the picker extends through
// it to the screen edges, so a segment cut off at the edge shows there is more to scroll to.
export function ScrollableSegmentedPicker({options, selectedValue, onValueChange, bleed = 0}) {
    const colors = useColors();

    return (
        <View style={[styles.container, {marginHorizontal: -bleed}]}>
            <Host style={styles.host}>
                <SingleChoiceSegmentedButtonRow modifiers={[horizontalScroll(), padding(bleed, 0, bleed, 0)]}>
                    {options.map(option => (
                        <SegmentedButton
                            key={option.value}
                            selected={option.value === selectedValue}
                            onClick={() => onValueChange(option.value)}
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
