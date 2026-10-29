import { View, StyleSheet } from 'react-native';
import { useMemo } from "react";
import { useColors } from "@/hooks/useThemeColors";

export default function UserScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return <View style={styles.container} />;
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
