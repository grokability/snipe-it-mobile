import {Host, Picker, ScrollView, Text} from "@expo/ui/swift-ui";
import {fixedSize, padding, pickerStyle, tag} from "@expo/ui/swift-ui/modifiers";
import {StyleSheet, View} from "react-native";

// A segmented picker for more segments than fit across the screen: it keeps its natural width
// and scrolls sideways. `bleed` is the parent's horizontal padding; the picker extends through
// it to the screen edges, so a segment cut off at the edge shows there is more to scroll to.
export function ScrollableSegmentedPicker({options, selectedValue, onValueChange, bleed = 0}) {
    return (
        <View style={[styles.container, {marginHorizontal: -bleed}]}>
            <Host style={styles.host}>
                <ScrollView axes="horizontal" showsIndicators={false}>
                    <Picker
                        selection={selectedValue}
                        onSelectionChange={onValueChange}
                        modifiers={[pickerStyle('segmented'), fixedSize(), padding({horizontal: bleed})]}
                    >
                        {options.map(option => (
                            <Text key={option.value} modifiers={[tag(option.value)]}>
                                {option.label}
                            </Text>
                        ))}
                    </Picker>
                </ScrollView>
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
        height: 40,
    },
});
