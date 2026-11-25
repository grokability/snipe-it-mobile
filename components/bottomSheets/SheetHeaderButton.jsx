import { Pressable, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useThemeColors";
import { HEADER_BUTTON_SIZE } from "@/components/ui/FloatingHeader";
import { FontWeight, Spacing, Typography } from "@/constants/sizes";

export const SheetHeaderButton = ({ title, onPress }) => {
    const colors = useColors();

    return (
        <Pressable
            onPress={() => onPress()}
            hitSlop={4}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.headerButtonBackground },
                pressed && styles.buttonPressed,
            ]}
        >
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        height: HEADER_BUTTON_SIZE,
        borderRadius: HEADER_BUTTON_SIZE / 2,
        paddingHorizontal: Spacing.lg,
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.8,
    },
    title: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
    },
});
