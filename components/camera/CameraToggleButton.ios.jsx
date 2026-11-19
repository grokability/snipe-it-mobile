import {Platform} from "react-native";
import {Button, Host, Image} from "@expo/ui/swift-ui";
import {
    accessibilityAddTraits,
    accessibilityLabel,
    buttonBorderShape,
    buttonStyle,
    controlSize,
    frame,
    tint,
} from "@expo/ui/swift-ui/modifiers";

// Liquid Glass needs iOS 26; expo-ui falls back to a borderless button before that
const SUPPORTS_GLASS = parseInt(Platform.Version, 10) >= 26;
// The yellow the iOS Camera app uses for a control that's on
const ON_TINT = '#FFD60A';

export default function CameraToggleButton({label, isOn, onToggle, iosSymbol, style}) {
    const offStyle = SUPPORTS_GLASS ? 'glass' : 'bordered';
    const onStyle = SUPPORTS_GLASS ? 'glassProminent' : 'borderedProminent';

    return (
        <Host matchContents style={style}>
            <Button
                onPress={() => onToggle(!isOn)}
                modifiers={[
                    accessibilityLabel(label),
                    buttonStyle(isOn ? onStyle : offStyle),
                    buttonBorderShape('circle'),
                    controlSize('large'),
                    ...(isOn ? [tint(ON_TINT), accessibilityAddTraits(['isSelected'])] : []),
                ]}
            >
                {/* A fixed frame keeps buttons the same size whatever the symbol's width */}
                <Image systemName={isOn ? iosSymbol.on : iosSymbol.off} modifiers={[frame({width: 24, height: 24})]} />
            </Button>
        </Host>
    );
}
