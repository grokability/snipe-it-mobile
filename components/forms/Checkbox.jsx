import {Checkbox as JetpackCheckbox, Host} from "@expo/ui/jetpack-compose";
import React from "react";
import {View} from "react-native";

export default function Checkbox({value, onValueChange, disabled}) {
    return (
        <View pointerEvents={disabled ? "none" : "auto"} style={{height: 32, justifyContent: 'center'}}>
            <Host matchContents>
                <JetpackCheckbox
                    value={value}
                    onCheckedChange={onValueChange}
                />
            </Host>
        </View>
    );
}
