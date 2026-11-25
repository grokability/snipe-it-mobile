import { Button } from "react-native";

export const SheetHeaderButton = ({ title, onPress }) => (
    <Button title={title} onPress={() => onPress()} />
);
