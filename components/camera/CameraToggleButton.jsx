import {FilledIconToggleButton, Host, Icon} from "@expo/ui/jetpack-compose";

export default function CameraToggleButton({label, isOn, onToggle, androidIcon, style}) {
    return (
        <Host matchContents style={style}>
            <FilledIconToggleButton checked={isOn} onCheckedChange={(checked) => onToggle(checked)}>
                <Icon source={isOn ? androidIcon.on : androidIcon.off} size={24} contentDescription={label} />
            </FilledIconToggleButton>
        </Host>
    );
}
