import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {useTranslation} from 'react-i18next';
import {decode} from 'html-entities';

function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = typeof dateStr === 'object' && dateStr.date ? dateStr.date : dateStr;
    if (!d) return null;
    return String(d).substring(0, 10);
}

export default function AuditListItem({item, isOverdue, onPress}) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    const nextDate = formatDate(item.next_audit_date);
    const lastDate = formatDate(item.last_audit_date);

    return (
        <Pressable
            onPress={onPress}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed,
            ]}
        >
            <View style={styles.contentContainer}>
                <Text style={styles.assetTag}>#{item.asset_tag}</Text>
                <Text style={styles.assetName}>
                    {item.name ? decode(item.name) : item.asset_tag}
                </Text>
                {item.model?.name && (
                    <Text style={styles.modelText}>{decode(item.model.name)}</Text>
                )}
                <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>{t('general.last_audit_date')}:</Text>
                    <Text style={styles.dateValue}>{lastDate || t('mobile.na')}</Text>
                </View>
                <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>{t('general.next_audit_date')}:</Text>
                    <Text style={[styles.dateValue, isOverdue && {color: colors.danger}]}>
                        {nextDate || t('mobile.na')}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

const createStyles = (colors) => StyleSheet.create({
    itemContainer: {
        width: '100%',
        padding: Spacing.lg,
        marginVertical: Spacing.sm,
        marginHorizontal: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.md,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    itemPressed: {
        backgroundColor: colors.backgroundSecondary,
        transform: [{scale: 0.995}],
    },
    contentContainer: {
        gap: 4,
    },
    assetTag: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    assetName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    modelText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
    },
    dateRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    dateLabel: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
    dateValue: {
        fontSize: Typography.caption,
        color: colors.text,
        fontWeight: FontWeight.medium,
    },
});
