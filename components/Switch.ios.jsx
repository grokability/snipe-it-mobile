import {Host, Switch as SwiftSwitch} from "@expo/ui/swift-ui";
import React from "react";

export default function Switch({value, onValueChange}) {
    return (
        <Host matchContents>
            <SwiftSwitch value={value} onValueChange={onValueChange} />
        </Host>
    );
}
