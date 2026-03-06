import {Host, Picker, Text} from "@expo/ui/swift-ui";
import {pickerStyle, tag} from "@expo/ui/swift-ui/modifiers";
import {StyleSheet, View} from "react-native";

export function SegmentedPicker({options, selectedValue, onValueChange}) {
    return (
        <View style={styles.container}>
            <Host matchContents>
                <Picker
                    selection={selectedValue}
                    onSelectionChange={onValueChange}
                    modifiers={[pickerStyle('segmented')]}
                    style={styles.picker}
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

const styles = StyleSheet.create({
    container: {
        paddingVertical: 4,
    },
    picker: {
        alignSelf: "center",
        height: 40,
        paddingVertical: 24,
    },
});
