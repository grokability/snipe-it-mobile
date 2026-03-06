import {Switch as JetPackSwitch, Host} from "@expo/ui/jetpack-compose";
import React from "react";

export default function Switch({value, onValueChange}) {
    return (
        <Host matchContents>
            <JetPackSwitch value={value} onValueChange={onValueChange} />
        </Host>
    );
}
