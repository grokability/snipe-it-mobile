import {Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {decode} from 'html-entities';
import {useLocalSearchParams, useNavigation} from 'expo-router';
import {useLayoutEffect, useMemo} from 'react';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {useTranslation} from 'react-i18next';
import {Section} from '@/components/ui/Section';
import {DetailRow} from '@/components/ui/DetailRow';
import {getActionBadgeColor, formatActionDate} from '@/helpers/utils';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';

export default function ActionLogDetailScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const {data: dataParam} = useLocalSearchParams();

    const actionLog = useMemo(() => {
        try { return JSON.parse(dataParam); } catch { return null; }
    }, [dataParam]);

    const badgeColor = useMemo(
        () => actionLog ? getActionBadgeColor(colors, actionLog.action_type) : colors.textSecondary,
        [colors, actionLog],
    );

    useLayoutEffect(() => {
        if (actionLog?.action_type) {
            navigation.setOptions({headerTitle: decode(actionLog.action_type)});
        }
    }, [navigation, actionLog]);

    if (!actionLog) return null;

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[
                    styles.content,
                    {paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0},
                ]}
                contentInsetAdjustmentBehavior="automatic"
            >
                <View style={styles.headerRow}>
                    <View style={[styles.badge, {backgroundColor: badgeColor + '22', borderColor: badgeColor + '55'}]}>
                        <Text style={[styles.badgeText, {color: badgeColor}]} numberOfLines={1}>
                            {decode(actionLog.action_type)}
                        </Text>
                    </View>
                    <Text style={styles.dateText}>{formatActionDate(actionLog.action_date)}</Text>
                </View>

                {actionLog.item && (
                    <Section title={t('general.item')}>
                        <DetailRow label={t('general.name')} value={decode(actionLog.item.name ?? t('mobile.na'))} />
                        <DetailRow label={t('general.type')} value={decode(actionLog.item.type ?? t('mobile.na'))} />
                        {actionLog.item.serial ? (
                            <DetailRow label={t('general.serial')} value={decode(actionLog.item.serial)} />
                        ) : null}
                    </Section>
                )}

                {actionLog.target ? (
                    <Section title={t('general.target')}>
                        <DetailRow label={t('general.name')} value={decode(actionLog.target.name ?? t('mobile.na'))} />
                        <DetailRow label={t('general.type')} value={decode(actionLog.target.type ?? t('mobile.na'))} />
                    </Section>
                ) : null}

                <Section title={t('mobile.section_details')}>
                    {actionLog.created_by?.name ? (
                        <DetailRow label={t('general.created_by')} value={decode(actionLog.created_by.name)} />
                    ) : null}
                    {actionLog.location?.name ? (
                        <DetailRow label={t('general.location')} value={decode(actionLog.location.name)} />
                    ) : null}
                    {actionLog.quantity != null ? (
                        <DetailRow label={t('general.quantity')} value={String(actionLog.quantity)} />
                    ) : null}
                    {actionLog.note ? (
                        <DetailRow label={t('general.notes')} value={decode(actionLog.note)} />
                    ) : null}
                    {actionLog.action_source ? (
                        <DetailRow label={t('general.action_source')} value={decode(actionLog.action_source)} />
                    ) : null}
                    <DetailRow label={t('general.action_date')} value={actionLog.action_date?.formatted ?? actionLog.action_date?.datetime ?? t('mobile.na')} />
                </Section>
            </ScrollView>
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl * 2,
        gap: Spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    badge: {
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    badgeText: {
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
    },
    dateText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        flex: 1,
        textAlign: 'right',
    },
});
