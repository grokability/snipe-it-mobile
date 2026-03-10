import React, {useState, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {Ionicons} from '@expo/vector-icons';

export const SectionHeader = ({title}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return <Text style={styles.sectionTitle}>{title}</Text>;
};

export const Section = ({title, children, collapsible = false, defaultCollapsed = true}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed);

    if (!collapsible) {
        return (
            <View>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.detailsContainer}>
                    {children}
                </View>
            </View>
        );
    }

    return (
        <View>
            <Pressable
                onPress={() => setCollapsed(prev => !prev)}
                style={({pressed}) => [
                    styles.collapsibleHeader,
                    pressed && styles.collapsibleHeaderPressed,
                ]}
            >
                <Text style={styles.sectionTitle}>{title}</Text>
                <Ionicons
                    name={collapsed ? 'chevron-forward' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                />
            </Pressable>
            {!collapsed && (
                <View style={styles.detailsContainer}>
                    {children}
                </View>
            )}
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
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    collapsibleHeaderPressed: {
        opacity: 0.7,
    },
    detailsContainer: {
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.lg,
    },
});
