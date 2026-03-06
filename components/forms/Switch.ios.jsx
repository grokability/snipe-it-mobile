import {Host, Toggle} from "@expo/ui/swift-ui";
import React from "react";

export default function Switch({value, onValueChange}) {
    return (
        <Host matchContents>
            <Toggle isOn={value} onIsOnChange={onValueChange} />
        </Host>
    );
}
