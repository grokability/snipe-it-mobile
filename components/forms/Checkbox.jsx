import {Switch as JetPackSwitch, Host} from "@expo/ui/jetpack-compose";
import React from "react";
import {View} from "react-native";

export default function Checkbox({value, onValueChange, disabled}) {
    return (
        <View pointerEvents={disabled ? "none" : "auto"} style={{height: 32, justifyContent: 'center'}}>
            <Host matchContents>
                <JetPackSwitch
                    variant="checkbox"
                    value={value}
                    onValueChange={onValueChange}
                />
            </Host>
        </View>
    );
}
