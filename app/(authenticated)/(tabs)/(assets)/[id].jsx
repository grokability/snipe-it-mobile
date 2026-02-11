import React, {useCallback, useContext, useState, useMemo} from 'react';
import {ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {makeRequest} from "@/helpers/axiosConfig";
import {decode} from "html-entities";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";


export const unstable_settings = {
    initialRouteName: 'index',
};


export default function AssetScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useContext(AuthContext);
    const { id } = useLocalSearchParams();

    const getAsset = useCallback(() => {
        setLoading(true);
        return makeRequest({
            url: `/hardware/${id}`,
            method: 'get'
        })
            .then(res => {
                setData({
                    asset: res,
                });
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            getAsset();
        }, [getAsset])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getAsset().finally(() => setRefreshing(false));
    }, [getAsset]);

    const DetailRow = ({label, value}) => {
        return (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text selectable style={styles.detailValue}>{value}</Text>
            </View>
        )
    };

    const SectionHeader = ({title}) => (
        <Text style={styles.sectionTitle}>{title}</Text>
    );

    const Section = ({title, children}) => (
        <View>
            <SectionHeader title={title} />
            <View style={styles.detailsContainer}>
                {children}
            </View>
        </View>
    );

    const na = t('mobile.na');
    const val = (v) => v ? decode(String(v)) : na;
    const nestedName = (obj) => obj?.name ? decode(obj.name) : na;
    const formatDate = (obj) => obj?.formatted || na;
    const formatBool = (v) => v ? t('mobile.yes') : t('mobile.no');

    if (loading || !data.asset) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary}/>
            </View>
        )
    }

    const asset = data.asset;
    const statusColor = asset.status_label?.status_meta === 'deployed'
        ? colors.success
        : asset.status_label?.status_meta === 'pending'
            ? colors.warning
            : colors.textSecondary;

    const customFields = asset.custom_fields ? Object.entries(asset.custom_fields) : [];

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top}]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Image */}
                {asset.image && (
                    <View style={styles.imageContainer}>
                        <Image source={{uri: asset.image}} style={styles.image}/>
                    </View>
                )}

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.assetTitle}>{val(asset.name)}</Text>
                    {asset.asset_tag && (
                        <Text selectable style={styles.assetTag}>{asset.asset_tag}</Text>
                    )}
                    {asset.status_label && (
                        <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
                            <Text style={styles.statusBadgeText}>{asset.status_label.name}</Text>
                        </View>
                    )}
                </View>

                {/* Assignment */}
                <View>
                    <SectionHeader title={t('mobile.section_assignment')} />
                    <View style={styles.assignmentContainer}>
                        {asset.assigned_to ? (
                            <>
                                <Text style={styles.assignedText}>
                                    {t('general.assigned_to')}<Text selectable style={styles.userName}>{asset.assigned_to.name}</Text>
                                </Text>
                                <Pressable
                                    style={({pressed}) => [styles.button, styles.checkinButton, pressed && styles.buttonPressed]}
                                    onPress={() => router.push(`/(tabs)/(assets)/checkin/${id}`)}
                                >
                                    <Text style={styles.buttonText}>{t('mobile.check_in_button')}</Text>
                                </Pressable>
                            </>
                        ) : (
                            <Pressable
                                style={({pressed}) => [styles.button, styles.checkoutButton, pressed && styles.buttonPressed]}
                                onPress={() => router.push(`/(tabs)/(assets)/checkout/${id}`)}
                            >
                                <Text style={styles.buttonText}>{t('mobile.check_out_button')}</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Details */}
                <Section title={t('mobile.section_details')}>
                    <DetailRow label={t('general.serial')} value={val(asset.serial)}/>
                    <DetailRow label={t('general.model')} value={nestedName(asset.model)}/>
                    <DetailRow label={t('general.model_number')} value={asset.model_number || na}/>
                    <DetailRow label={t('general.category')} value={nestedName(asset.category)}/>
                    <DetailRow label={t('general.manufacturer')} value={nestedName(asset.manufacturer)}/>
                    <DetailRow label={t('general.company')} value={nestedName(asset.company)}/>
                    <DetailRow label={t('general.byod')} value={formatBool(asset.byod)}/>
                    <DetailRow label={t('general.requestable')} value={formatBool(asset.requestable)}/>
                </Section>

                {/* Location */}
                <Section title={t('mobile.section_location')}>
                    <DetailRow label={t('general.location')} value={nestedName(asset.location)}/>
                    <DetailRow label={t('general.rtd_location')} value={nestedName(asset.rtd_location)}/>
                </Section>

                {/* Purchase */}
                <Section title={t('mobile.section_purchase')}>
                    <DetailRow label={t('general.purchase_date')} value={formatDate(asset.purchase_date)}/>
                    <DetailRow label={t('general.purchase_cost')} value={val(asset.purchase_cost)}/>
                    <DetailRow label={t('general.order_number')} value={val(asset.order_number)}/>
                    <DetailRow label={t('general.supplier')} value={nestedName(asset.supplier)}/>
                    <DetailRow label={t('general.warranty_months')} value={asset.warranty_months ? `${asset.warranty_months} months` : na}/>
                    <DetailRow label={t('general.warranty_expires')} value={formatDate(asset.warranty_expires)}/>
                    <DetailRow label={t('general.eol')} value={val(asset.eol)}/>
                </Section>

                {/* Dates */}
                <Section title={t('mobile.section_dates')}>
                    <DetailRow label={t('general.last_checkout')} value={formatDate(asset.last_checkout)}/>
                    <DetailRow label={t('general.expected_checkin')} value={formatDate(asset.expected_checkin)}/>
                    <DetailRow label={t('general.last_audit_date')} value={formatDate(asset.last_audit_date)}/>
                    <DetailRow label={t('general.next_audit_date')} value={formatDate(asset.next_audit_date)}/>
                    <DetailRow label={t('general.created_at')} value={formatDate(asset.created_at)}/>
                    <DetailRow label={t('general.updated_at')} value={formatDate(asset.updated_at)}/>
                </Section>

                {/* Counters */}
                <Section title={t('mobile.section_counters')}>
                    <DetailRow label={t('general.checkin_counter')} value={String(asset.checkin_counter ?? 0)}/>
                    <DetailRow label={t('general.checkout_counter')} value={String(asset.checkout_counter ?? 0)}/>
                    <DetailRow label={t('general.requests_counter')} value={String(asset.requests_counter ?? 0)}/>
                </Section>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                    <Section title={t('mobile.section_custom_fields')}>
                        {customFields.map(([key, field]) => (
                            <DetailRow key={key} label={field.field} value={val(field.value)}/>
                        ))}
                    </Section>
                )}

                {/* Notes */}
                {asset.notes && (
                    <View>
                        <SectionHeader title={t('mobile.section_notes')} />
                        <View style={styles.detailsContainer}>
                            <Text selectable style={styles.notesText}>{asset.notes}</Text>
                        </View>
                    </View>
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
    assetTitle: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
        textAlign: 'center',
    },
    assetTag: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.lg,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
    },
    sectionTitle: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: colors.text,
        marginBottom: Spacing.sm,
    },
    detailsContainer: {
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.md,
    },
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
    assignmentContainer: {
        backgroundColor: colors.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        gap: Spacing.lg,
    },
    assignedText: {
        fontSize: Typography.bodyLarge,
        color: colors.textSecondary,
    },
    userName: {
        color: colors.primary,
        fontWeight: FontWeight.semibold,
    },
    button: {
        width: '100%',
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    checkinButton: {
        backgroundColor: colors.danger,
    },
    checkoutButton: {
        backgroundColor: colors.success,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{scale: 0.98}],
    },
    buttonText: {
        color: '#fff',
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
    },
    notesText: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
        lineHeight: Typography.bodyLarge * 1.5,
    },
});
