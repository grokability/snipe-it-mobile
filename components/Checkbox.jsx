import {Switch as JetPackSwitch} from "@expo/ui/jetpack-compose";
import React from "react";
import {View} from "react-native";

export default function Checkbox({value, onValueChange, disabled}) {
    return (
        <View pointerEvents={disabled ? "none" : "auto"} style={{height: 32, justifyContent: 'center'}}>
            <JetPackSwitch
                variant="checkbox"
                value={value}
                onValueChange={onValueChange}
            />
        </View>
    );
}
