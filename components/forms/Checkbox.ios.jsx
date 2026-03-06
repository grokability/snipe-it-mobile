import {Host, Toggle} from "@expo/ui/swift-ui";
import React from "react";
import {View} from "react-native";

export default function Checkbox({value, onValueChange, disabled}) {
    return (
        <View pointerEvents={disabled ? "none" : "auto"} style={{height: 32, justifyContent: 'center'}}>
            <Host matchContents>
                <Toggle
                    isOn={value}
                    onIsOnChange={onValueChange}
                />
            </Host>
        </View>
    );
}
