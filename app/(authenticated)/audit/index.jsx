import React, {useCallback, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {router, useFocusEffect} from 'expo-router';
import {makeRequest} from '@/helpers/axiosConfig';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '@/hooks/useThemeColors';
import {Spacing, BorderRadius, Typography, FontWeight} from '@/constants/sizes';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {decode} from 'html-entities';
import {SegmentedPicker} from '@/components/ui/SegmentedPicker';

function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = typeof dateStr === 'object' && dateStr.date ? dateStr.date : dateStr;
    if (!d) return null;
    return String(d).substring(0, 10);
}

export default function AuditListScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();

    const [tab, setTab] = useState('due'); // 'due' | 'overdue'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const fetchAudits = useCallback((reset = false) => {
        const currentOffset = reset ? 0 : offset;
        setLoading(true);
        return makeRequest({
            url: `/hardware/audits/${tab}?limit=25&offset=${currentOffset}&sort=next_audit_date&order=asc`,
            method: 'GET',
        })
            .then((res) => {
                const rows = res.rows || [];
                if (reset) {
                    setData(rows);
                    setOffset(rows.length);
                } else {
                    setData((prev) => [...prev, ...rows]);
                    setOffset(currentOffset + rows.length);
                }
                setHasMore(rows.length === 25);
            })
            .catch((err) => {
                console.error('Error fetching audits:', err);
            })
            .finally(() => setLoading(false));
    }, [tab, offset]);

    useFocusEffect(
        useCallback(() => {
            setData([]);
            setOffset(0);
            setHasMore(true);
            setLoading(true);
            makeRequest({
                url: `/hardware/audits/${tab}?limit=25&offset=0&sort=next_audit_date&order=asc`,
                method: 'GET',
            })
                .then((res) => {
                    const rows = res.rows || [];
                    setData(rows);
                    setOffset(rows.length);
                    setHasMore(rows.length === 25);
                })
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }, [tab])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setOffset(0);
        makeRequest({
            url: `/hardware/audits/${tab}?limit=25&offset=0&sort=next_audit_date&order=asc`,
            method: 'GET',
        })
            .then((res) => {
                const rows = res.rows || [];
                setData(rows);
                setOffset(rows.length);
                setHasMore(rows.length === 25);
            })
            .catch((err) => console.error(err))
            .finally(() => setRefreshing(false));
    }, [tab]);

    const loadMore = () => {
        if (loading || !hasMore) return;
        fetchAudits(false);
    };

    const Item = ({item}) => {
        const nextDate = formatDate(item.next_audit_date);
        const lastDate = formatDate(item.last_audit_date);
        const isOverdue = tab === 'overdue';

        return (
            <Pressable
                onPress={() => router.push(`/(authenticated)/audit/confirm?asset_tag=${encodeURIComponent(item.asset_tag)}`)}
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
    };

    const segmentOptions = [
        {label: t('general.audit_due'), value: 'due'},
        {label: t('general.audit_overdue'), value: 'overdue'},
    ];

    return (
        <View style={styles.container}>
            <View style={[styles.header, {paddingTop: Platform.OS === 'android' ? insets.top + 56 : insets.top + 44}]}>
                <SegmentedPicker
                    options={segmentOptions}
                    selectedValue={tab}
                    onValueChange={setTab}
                />
            </View>

            <FlashList
                data={data}
                renderItem={({item}) => <Item item={item} />}
                keyExtractor={(item) => String(item.id)}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                estimatedItemSize={120}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{paddingBottom: 100}}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('mobile.audit_no_items')}</Text>
                        </View>
                    ) : null
                }
            />

            {/* Scan to Audit button */}
            <View style={[styles.fabContainer, {bottom: insets.bottom + 20}]}>
                <Pressable
                    onPress={() => router.push('/scanner?mode=audit')}
                    style={({pressed}) => [
                        styles.fab,
                        pressed && styles.fabPressed,
                    ]}
                >
                    <Text style={styles.fabText}>{t('mobile.audit_scan')}</Text>
                </Pressable>
            </View>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: colors.background,
    },
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
    emptyContainer: {
        padding: Spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary,
    },
    fabContainer: {
        position: 'absolute',
        left: Spacing.lg,
        right: Spacing.lg,
    },
    fab: {
        backgroundColor: colors.primary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    fabPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}],
    },
    fabText: {
        color: '#fff',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
    },
});
