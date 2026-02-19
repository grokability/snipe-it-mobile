import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";

export const SectionHeader = ({title}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return <Text style={styles.sectionTitle}>{title}</Text>;
};

export const Section = ({title, children}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.detailsContainer}>
                {children}
            </View>
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    sectionTitle: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: colors.text,
        marginBottom: Spacing.sm,
    },
    detailsContainer: {
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.lg,
    },
});
