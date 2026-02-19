import {Host, Switch as SwiftSwitch} from "@expo/ui/swift-ui";
import React from "react";
import {View} from "react-native";

export default function Checkbox({value, onValueChange, disabled}) {
    return (
        <View pointerEvents={disabled ? "none" : "auto"} style={{height: 32, justifyContent: 'center'}}>
            <Host matchContents>
                <SwiftSwitch
                    variant="checkbox"
                    value={value}
                    onValueChange={onValueChange}
                />
            </Host>
        </View>
    );
}
