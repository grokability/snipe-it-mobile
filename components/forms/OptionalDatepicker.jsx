import {Pressable, StyleSheet, Text, View} from "react-native";
import React, {useState, useMemo} from "react";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography} from "@/constants/sizes";
import {Ionicons} from '@expo/vector-icons';
import {useTranslation} from "react-i18next";
import Datepicker from "@/components/forms/Datepicker";

function formatDisplayDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Wraps the Datepicker with an opt-in UX:
 * - Shows a placeholder button when no date is set
 * - Shows the Datepicker + clear button when a date is active
 */
export default function OptionalDatepicker({initialDate, onDateChange}) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const [hasDate, setHasDate] = useState(!!initialDate);
    const [currentDate, setCurrentDate] = useState(initialDate || null);

    const enableDate = () => {
        const today = new Date();
        setHasDate(true);
        setCurrentDate(today);
        onDateChange(null, today);
    };

    const clearDate = () => {
        setHasDate(false);
        setCurrentDate(null);
        onDateChange(null, null);
    };

    const handleDateChange = (event, date) => {
        if (date) {
            setCurrentDate(date);
            onDateChange(event, date);
        }
    };

    if (!hasDate) {
        return (
            <Pressable
                onPress={enableDate}
                style={({pressed}) => [
                    styles.placeholder,
                    pressed && styles.pressed,
                ]}
            >
                <Text style={styles.placeholderText}>{t('mobile.select_date')}</Text>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            </Pressable>
        );
    }

    return (
        <View style={styles.activeRow}>
            <View style={styles.pickerContainer}>
                <Datepicker
                    initialDate={currentDate}
                    onDateChange={handleDateChange}
                />
            </View>
            <Pressable
                onPress={clearDate}
                style={({pressed}) => [
                    styles.clearButton,
                    pressed && styles.pressed,
                ]}
                hitSlop={8}
            >
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </Pressable>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    placeholder: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        backgroundColor: colors.backgroundTertiary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
    placeholderText: {
        fontSize: Typography.bodyLarge,
        color: colors.textMuted,
    },
    activeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    pickerContainer: {
        flex: 1,
    },
    clearButton: {
        padding: Spacing.xs,
    },
});
