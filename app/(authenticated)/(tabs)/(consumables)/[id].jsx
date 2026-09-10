import React, {useState, useMemo, useLayoutEffect} from 'react';
import {Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useLocalSearchParams, useNavigation} from "expo-router";
import {useQuery} from '@tanstack/react-query';
import {Ionicons} from '@expo/vector-icons';
import {makeRequest} from "@/helpers/axiosConfig";
import {consumableKeys} from "@/helpers/queryKeys";
import {useRefreshOnFocus} from "@/hooks/useRefreshOnFocus";
import {ConsumableDetailSkeleton} from "@/components/ui/Skeleton";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {PermissionGate} from "@/permissions/PermissionGate";
import {decode} from "html-entities";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {Section} from "@/components/ui/Section";
import {DetailRow} from "@/components/ui/DetailRow";

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function ConsumableScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { id } = useLocalSearchParams();
    const navigation = useNavigation();

    const consumableQuery = useQuery({
        queryKey: consumableKeys.detail(id),
        queryFn: () => makeRequest({ url: `/consumables/${id}`, method: 'get', permissionKey: PERMISSIONS.CONSUMABLES_VIEW }),
    });

    useRefreshOnFocus(consumableKeys.detail(id));

    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const onManualRefresh = async () => {
        setIsManualRefreshing(true);
        await consumableQuery.refetch();
        setIsManualRefreshing(false);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtonGroup}>
                    <Pressable onPress={() => router.push(`/(tabs)/(consumables)/edit/${id}`)} hitSlop={4}>
                        <Ionicons name="pencil" size={22} color={colors.text} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, id, colors.text]);

    const na = t('mobile.na');
    const displayValue = (value) => value ? decode(String(value)) : na;
    const nestedName = (object) => object?.name ? decode(object.name) : na;
    const formatDate = (dateObject) => dateObject?.formatted ?? na;
    const formatBool = (value) => value ? t('mobile.yes') : t('mobile.no');

    const consumable = consumableQuery.data;

    if (!consumable) {
        return <ConsumableDetailSkeleton />;
    }

    const available = consumable.remaining > 0;

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.container}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.contentContainer, {paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0}]}
                refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={onManualRefresh} />}
            >
                {/* Image */}
                <View style={styles.imageContainer}>
                    {consumable.image
                        ? <Image source={{uri: consumable.image}} style={styles.image}/>
                        : <Ionicons name="cube-outline" size={80} color={colors.textSecondary} />
                    }
                </View>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>{displayValue(consumable.name)}</Text>
                    <View style={[styles.qtyBadge, available ? styles.qtyBadgeAvailable : styles.qtyBadgeEmpty]}>
                        <Text style={[styles.qtyBadgeText, available ? styles.qtyBadgeTextAvailable : styles.qtyBadgeTextEmpty]}>
                            {consumable.remaining}/{consumable.qty}
                        </Text>
                    </View>
                    <Text style={[styles.availText, available ? styles.availTextGreen : styles.availTextRed]}>
                        {available ? t('mobile.available') : t('mobile.out_of_stock')}
                    </Text>
                </View>

                {/* Checkout Action */}
                <PermissionGate permission={PERMISSIONS.CONSUMABLES_CHECKOUT}>
                    {consumable.user_can_checkout && (
                        <Pressable
                            style={({pressed}) => [styles.checkoutButton, pressed && styles.buttonPressed]}
                            onPress={() => router.push(`/(tabs)/(consumables)/checkout/${id}`)}
                        >
                            <Text style={styles.checkoutButtonText}>{t('mobile.check_out_button')}</Text>
                        </Pressable>
                    )}
                </PermissionGate>

                {/* Details */}
                <Section title={t('mobile.section_details')}>
                    <DetailRow label={t('general.category')} value={nestedName(consumable.category)}/>
                    <DetailRow label={t('general.manufacturer')} value={nestedName(consumable.manufacturer)}/>
                    <DetailRow label={t('general.supplier')} value={nestedName(consumable.supplier)}/>
                    <DetailRow label={t('mobile.item_number')} value={displayValue(consumable.item_no)}/>
                    <DetailRow label={t('general.model_number')} value={displayValue(consumable.model_number)}/>
                    <DetailRow label={t('general.order_number')} value={displayValue(consumable.order_number)}/>
                    <DetailRow label={t('mobile.min_qty_alert')} value={displayValue(consumable.min_amt)}/>
                    <DetailRow label={t('general.requestable')} value={formatBool(consumable.requestable)}/>
                </Section>

                {/* Location */}
                <Section title={t('mobile.section_location')}>
                    <DetailRow label={t('general.location')} value={nestedName(consumable.location)}/>
                    <DetailRow label={t('general.company')} value={nestedName(consumable.company)}/>
                </Section>

                {/* Purchase */}
                <Section title={t('mobile.section_purchase')}>
                    <DetailRow label={t('general.purchase_date')} value={formatDate(consumable.purchase_date)}/>
                    <DetailRow label={t('general.purchase_cost')} value={displayValue(consumable.purchase_cost)}/>
                    <DetailRow label={t('general.total_cost')} value={displayValue(consumable.total_cost)}/>
                </Section>

                {/* Notes */}
                {consumable.notes && (
                    <Section title={t('mobile.section_notes')}>
                        <Text selectable style={styles.notesText}>{consumable.notes}</Text>
                    </Section>
                )}
            </ScrollView>
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: Spacing.lg,
        paddingBottom: 80,
        gap: Spacing.xxl,
    },
    imageContainer: {
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
    },
    image: {
        width: 250,
        height: 250,
        borderRadius: BorderRadius.md,
    },
    headerContainer: {
        alignItems: 'center',
        gap: Spacing.sm,
    },
    title: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
        textAlign: 'center',
    },
    qtyBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.lg,
    },
    qtyBadgeAvailable: {
        backgroundColor: colors.successBackground ?? colors.success + '22',
    },
    qtyBadgeEmpty: {
        backgroundColor: colors.dangerBackground ?? colors.danger + '22',
    },
    qtyBadgeText: {
        fontSize: Typography.body,
        fontWeight: FontWeight.semibold,
    },
    qtyBadgeTextAvailable: {
        color: colors.success,
    },
    qtyBadgeTextEmpty: {
        color: colors.danger,
    },
    availText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.medium,
    },
    availTextGreen: {
        color: colors.success,
    },
    availTextRed: {
        color: colors.danger,
    },
    checkoutButton: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        backgroundColor: colors.success,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}],
    },
    notesText: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
        lineHeight: Typography.bodyLarge * 1.5,
    },
    headerButtonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
});
