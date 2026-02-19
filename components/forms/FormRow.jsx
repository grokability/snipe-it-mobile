import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, Typography, FontWeight} from "@/constants/sizes";

export const FormRow = ({label, children, horizontal}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={[styles.formRow, horizontal && styles.formRowHorizontal]}>
            <Text style={styles.formLabel}>{label}</Text>
            {children}
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    formRow: {
        gap: Spacing.xs,
    },
    formRowHorizontal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    formLabel: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
});
