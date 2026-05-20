import React, {useCallback, useState, useMemo, useLayoutEffect} from 'react';
import {ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams, useNavigation} from "expo-router";
import {Ionicons} from '@expo/vector-icons';
import {makeRequest} from "@/helpers/axiosConfig";
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

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            unstable_headerRightItems: () => [
                { type: 'spacing', spacing: 8 },
                {
                    type: 'custom',
                    element: (
                        <View style={styles.headerButtonGroup}>
                            <Pressable onPress={() => router.push(`/(tabs)/(consumables)/edit/${id}`)} hitSlop={4}>
                                <Ionicons name="pencil" size={22} color={colors.text} />
                            </Pressable>
                        </View>
                    ),
                },
            ],
        });
    }, [navigation, id, colors.text]);

    const getConsumable = useCallback(() => {
        setLoading(true);
        return makeRequest({ url: `/consumables/${id}`, method: 'get', permissionKey: PERMISSIONS.CONSUMABLES_VIEW })
            .then(res => {
                setData(res);
            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            getConsumable();
        }, [getConsumable])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getConsumable().finally(() => setRefreshing(false));
    }, [getConsumable]);

    const na = t('mobile.na');
    const displayValue = (value) => value ? decode(String(value)) : na;
    const nestedName = (object) => object?.name ? decode(object.name) : na;
    const formatDate = (dateObject) => dateObject?.formatted ?? na;
    const formatBool = (value) => value ? t('mobile.yes') : t('mobile.no');

    if (loading || !data) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary}/>
            </View>
        );
    }

    const available = data.remaining > 0;

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top}]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Image */}
                <View style={styles.imageContainer}>
                    {data.image
                        ? <Image source={{uri: data.image}} style={styles.image}/>
                        : <Ionicons name="cube-outline" size={80} color={colors.textSecondary} />
                    }
                </View>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>{displayValue(data.name)}</Text>
                    <View style={[styles.qtyBadge, available ? styles.qtyBadgeAvailable : styles.qtyBadgeEmpty]}>
                        <Text style={[styles.qtyBadgeText, available ? styles.qtyBadgeTextAvailable : styles.qtyBadgeTextEmpty]}>
                            {data.remaining}/{data.qty}
                        </Text>
                    </View>
                    <Text style={[styles.availText, available ? styles.availTextGreen : styles.availTextRed]}>
                        {available ? t('mobile.available') : t('mobile.out_of_stock')}
                    </Text>
                </View>

                {/* Checkout Action */}
                <PermissionGate permission={PERMISSIONS.CONSUMABLES_CHECKOUT}>
                    {data.user_can_checkout && (
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
                    <DetailRow label={t('general.category')} value={nestedName(data.category)}/>
                    <DetailRow label={t('general.manufacturer')} value={nestedName(data.manufacturer)}/>
                    <DetailRow label={t('general.supplier')} value={nestedName(data.supplier)}/>
                    <DetailRow label={t('mobile.item_number')} value={displayValue(data.item_no)}/>
                    <DetailRow label={t('general.model_number')} value={displayValue(data.model_number)}/>
                    <DetailRow label={t('general.order_number')} value={displayValue(data.order_number)}/>
                    <DetailRow label={t('mobile.min_qty_alert')} value={displayValue(data.min_amt)}/>
                    <DetailRow label={t('general.requestable')} value={formatBool(data.requestable)}/>
                </Section>

                {/* Location */}
                <Section title={t('mobile.section_location')}>
                    <DetailRow label={t('general.location')} value={nestedName(data.location)}/>
                    <DetailRow label={t('general.company')} value={nestedName(data.company)}/>
                </Section>

                {/* Purchase */}
                <Section title={t('mobile.section_purchase')}>
                    <DetailRow label={t('general.purchase_date')} value={formatDate(data.purchase_date)}/>
                    <DetailRow label={t('general.purchase_cost')} value={displayValue(data.purchase_cost)}/>
                    <DetailRow label={t('general.total_cost')} value={displayValue(data.total_cost)}/>
                </Section>

                {/* Notes */}
                {data.notes && (
                    <Section title={t('mobile.section_notes')}>
                        <Text selectable style={styles.notesText}>{data.notes}</Text>
                    </Section>
                )}
            </ScrollView>
        </SafeAreaProvider>
    );
}

const createStyles = (colors) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
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
