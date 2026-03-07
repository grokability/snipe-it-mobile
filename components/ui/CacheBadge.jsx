import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, Typography, FontWeight, BorderRadius } from '@/constants/sizes';
import { formatCacheAge, getCacheAgeColor } from '@/helpers/cacheManager';
import { useTranslation } from 'react-i18next';

export function CacheBadge({ cachedAt }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    if (!cachedAt) return null;

    const ageText = formatCacheAge(cachedAt);
    const ageColorKey = getCacheAgeColor(cachedAt);
    const badgeColor = ageColorKey ? colors[ageColorKey] : colors.textSecondary;

    return (
        <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>
                {t('mobile.cached_ago', { time: ageText })}
            </Text>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
    },
});
