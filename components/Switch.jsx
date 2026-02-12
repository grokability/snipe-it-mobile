import {Switch as JetPackSwitch} from "@expo/ui/jetpack-compose";
import React from "react";

export default function Switch({value, onValueChange}) {
    return (
        <JetPackSwitch value={value} onValueChange={onValueChange} />
    );
}
