import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, BorderRadius, Typography, FontWeight } from '@/constants/sizes';

// A small tinted label. type is a theme colour name: 'primary', 'warning', 'danger' or 'success'.
export default function Badge({ type, children }) {
    const colors = useColors();
    const typeColor = colors[type];

    return (
        <View style={[styles.badge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.text, { color: typeColor }]}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    text: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
    },
});
