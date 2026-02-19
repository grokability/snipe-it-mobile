import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, Typography, FontWeight} from "@/constants/sizes";

const useDetailRowStyles = () => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return {colors, styles};
};

export const DetailRow = ({label, value}) => {
    const {styles} = useDetailRowStyles();
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text selectable style={styles.detailValue}>{value}</Text>
        </View>
    );
};

export const EncryptedDetailRow = ({label, value}) => {
    const {colors, styles} = useDetailRowStyles();
    const [revealed, setRevealed] = useState(false);
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            {revealed ? (
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.sm}}>
                    <Text selectable style={[styles.detailValue, {flex: 1}]}>{value}</Text>
                    <Pressable onPress={() => setRevealed(false)} hitSlop={8}>
                        <Ionicons name="lock-open-outline" size={20} color={colors.textSecondary} />
                    </Pressable>
                </View>
            ) : (
                <Pressable onPress={() => setRevealed(true)} hitSlop={8}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                </Pressable>
            )}
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
        flex: 1,
    },
    detailValue: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
        fontWeight: FontWeight.semibold,
        flex: 1,
        textAlign: 'right',
    },
});
