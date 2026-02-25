import React, {useCallback, useContext, useState, useMemo, useLayoutEffect} from 'react';
import {ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams, useNavigation} from "expo-router";
import {Ionicons} from '@expo/vector-icons';
import TopNavMenu from "@/components/overlays/TopNavMenu";
import {makeRequest} from "@/helpers/axiosConfig";
import {decode} from "html-entities";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {Section} from "@/components/ui/Section";
import {DetailRow} from "@/components/ui/DetailRow";


export const unstable_settings = {
    initialRouteName: 'index',
};


export default function AccessoryScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Pressable onPress={() => router.push(`/(tabs)/(accessories)/edit/${id}`)}>
                        <Ionicons name="pencil" size={22} color={colors.text} />
                    </Pressable>
                    <TopNavMenu />
                </View>
            ),
        });
    }, [navigation, id, colors.text]);

    const getAccessory = useCallback(() => {
        setLoading(true);
        return Promise.all([
            makeRequest({ url: `/accessories/${id}`, method: 'get' }),
            makeRequest({ url: `/accessories/${id}/checkedout`, method: 'get' }),
        ])
            .then(([accessoryRes, checkedOutRes]) => {
                setData({
                    accessory: accessoryRes,
                    checkedOut: checkedOutRes?.rows ?? [],
                });
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
            getAccessory();
        }, [getAccessory])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getAccessory().finally(() => setRefreshing(false));
    }, [getAccessory]);

    const na = t('mobile.na');
    const displayValue = (value) => value ? decode(String(value)) : na;
    const nestedName = (object) => object?.name ? decode(object.name) : na;
    const formatDate = (dateObject) => dateObject?.formatted ?? na;
    const formatBool = (value) => value ? t('mobile.yes') : t('mobile.no');

    if (loading || !data.accessory) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary}/>
            </View>
        );
    }

    const item = data.accessory;
    const checkedOut = data.checkedOut ?? [];
    const available = item.remaining_qty > 0;

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top}]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Image */}
                {item.image && (
                    <View style={styles.imageContainer}>
                        <Image source={{uri: item.image}} style={styles.image}/>
                    </View>
                )}

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>{displayValue(item.name)}</Text>
                    <View style={[styles.qtyBadge, available ? styles.qtyBadgeAvailable : styles.qtyBadgeEmpty]}>
                        <Text style={[styles.qtyBadgeText, available ? styles.qtyBadgeTextAvailable : styles.qtyBadgeTextEmpty]}>
                            {item.remaining_qty}/{item.qty}
                        </Text>
                    </View>
                    <Text style={[styles.availText, available ? styles.availTextGreen : styles.availTextRed]}>
                        {available ? t('mobile.available') : t('mobile.out_of_stock')}
                    </Text>
                </View>

                {/* Details */}
                <Section title={t('mobile.section_details')}>
                    <DetailRow label={t('general.category')} value={nestedName(item.category)}/>
                    <DetailRow label={t('general.manufacturer')} value={nestedName(item.manufacturer)}/>
                    <DetailRow label={t('general.supplier')} value={nestedName(item.supplier)}/>
                    <DetailRow label={t('general.model_number')} value={displayValue(item.model_number)}/>
                    <DetailRow label={t('general.order_number')} value={displayValue(item.order_number)}/>
                    <DetailRow label={t('mobile.min_qty_alert')} value={displayValue(item.min_amt)}/>
                    <DetailRow label={t('general.requestable')} value={formatBool(item.requestable)}/>
                </Section>

                {/* Location */}
                <Section title={t('mobile.section_location')}>
                    <DetailRow label={t('general.location')} value={nestedName(item.location)}/>
                    <DetailRow label={t('general.company')} value={nestedName(item.company)}/>
                </Section>

                {/* Purchase */}
                <Section title={t('mobile.section_purchase')}>
                    <DetailRow label={t('general.purchase_date')} value={formatDate(item.purchase_date)}/>
                    <DetailRow label={t('general.purchase_cost')} value={displayValue(item.purchase_cost)}/>
                    <DetailRow label={t('general.total_cost')} value={displayValue(item.total_cost)}/>
                </Section>

                {/* Checked Out Records */}
                <Section title={t('mobile.section_checked_out')}>
                    {checkedOut.length === 0 ? (
                        <Text style={styles.emptyText}>{t('mobile.no_checkouts')}</Text>
                    ) : (
                        checkedOut.map((record) => (
                            <View key={record.id} style={styles.checkoutRow}>
                                <View style={styles.checkoutInfo}>
                                    <Text style={styles.checkoutName}>{record.assigned_to?.name ?? na}</Text>
                                    {record.created_at?.formatted && (
                                        <Text style={styles.checkoutDate}>{record.created_at.formatted}</Text>
                                    )}
                                </View>
                                <Pressable
                                    style={({pressed}) => [styles.checkinButton, pressed && styles.buttonPressed]}
                                    onPress={() => router.push({
                                        pathname: `/(tabs)/(accessories)/checkin/${id}`,
                                        params: { checkoutRecordId: record.id },
                                    })}
                                >
                                    <Text style={styles.checkinButtonText}>{t('mobile.check_in_button')}</Text>
                                </Pressable>
                            </View>
                        ))
                    )}
                </Section>

                {/* Notes */}
                {item.notes && (
                    <Section title={t('mobile.section_notes')}>
                        <Text selectable style={styles.notesText}>{item.notes}</Text>
                    </Section>
                )}

                {/* Checkout Action */}
                {item.user_can_checkout && (
                    <Pressable
                        style={({pressed}) => [styles.checkoutButton, pressed && styles.buttonPressed]}
                        onPress={() => router.push(`/(tabs)/(accessories)/checkout/${id}`)}
                    >
                        <Text style={styles.checkoutButtonText}>{t('mobile.check_out_button')}</Text>
                    </Pressable>
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
    emptyText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    checkoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    checkoutInfo: {
        flex: 1,
        gap: 2,
    },
    checkoutName: {
        fontSize: Typography.body,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    checkoutDate: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
    checkinButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        backgroundColor: colors.danger,
    },
    checkinButtonText: {
        color: '#fff',
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
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
});
