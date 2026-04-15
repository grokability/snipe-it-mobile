import React, {useCallback, useContext, useState, useMemo, useLayoutEffect} from 'react';
import {ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams, useNavigation} from "expo-router";
import {Ionicons} from '@expo/vector-icons';
import {makeRequest} from "@/helpers/axiosConfig";
import {decode} from "html-entities";
import {AuthContext} from "@/context/AuthProvider";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import Checkbox from "@/components/forms/Checkbox";
import {Section, SectionHeader} from "@/components/ui/Section";
import {DetailRow, EncryptedDetailRow} from "@/components/ui/DetailRow";


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
                            <Pressable onPress={() => router.push('/(tabs)/(assets)/create')} hitSlop={4}>
                                <Ionicons name="add" size={26} color={colors.text} />
                            </Pressable>
                            <Pressable onPress={() => router.push(`/(tabs)/(assets)/edit/${id}`)} hitSlop={4}>
                                <Ionicons name="pencil" size={22} color={colors.text} />
                            </Pressable>
                        </View>
                    ),
                },
            ],
        });
    }, [navigation, id, colors.text]);

    const getAsset = useCallback(() => {
        setLoading(true);
        return Promise.all([
            makeRequest({ url: `/hardware/${id}`, method: 'get' }),
            makeRequest({ url: '/fields', method: 'get' }),
        ])
            .then(([assetRes, fieldsRes]) => {
                // Merge field_values and field_encrypted from field definitions into asset custom_fields
                if (assetRes.custom_fields && fieldsRes?.rows) {
                    const fieldDefs = {};
                    fieldsRes.rows.forEach(fieldDefinition => {
                        fieldDefs[fieldDefinition.db_column_name] = fieldDefinition;
                    });
                    Object.values(assetRes.custom_fields).forEach(field => {
                        const fieldDefinition = fieldDefs[field.field];
                        if (fieldDefinition) {
                            if (fieldDefinition.field_values_array) {
                                field.field_values = fieldDefinition.field_values_array;
                            }
                            field.field_encrypted = Boolean(fieldDefinition.field_encrypted);
                        }
                    });
                }
                setData({ asset: assetRes });
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
            getAsset();
        }, [getAsset])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getAsset().finally(() => setRefreshing(false));
    }, [getAsset]);

    const na = t('mobile.na');
    const displayValue = (value) => value ? decode(String(value)) : na;
    const nestedName = (object) => object?.name ? decode(object.name) : na;
    const formatDate = (dateObject) => dateObject?.formatted || na;
    const formatBool = (value) => value ? t('mobile.yes') : t('mobile.no');

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
                contentContainerStyle={[styles.contentContainer, {paddingTop: insets.top + 44}]}
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
                    <Text style={styles.assetTitle}>{displayValue(asset.name)}</Text>
                    {asset.asset_tag && (
                        <Text selectable style={styles.assetTag}>{asset.asset_tag}</Text>
                    )}
                    {asset.status_label && (
                        <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
                            <Text style={styles.statusBadgeText}>{asset.status_label.name}</Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View>
                    <SectionHeader title={t('mobile.section_actions')} />
                    <View style={styles.assignmentContainer}>
                        {asset.assigned_to ? (
                            <>
                                <Text style={styles.assignedText}>
                                    {t('general.assigned_to')}<Text selectable style={styles.userName}>{asset.assigned_to.name}</Text>
                                </Text>
                                <Pressable
                                    style={({pressed}) => [styles.button, styles.checkinButton, pressed && styles.buttonPressed]}
                                    onPress={() => router.push({
                                    pathname: `/(tabs)/(assets)/checkin/${id}`,
                                    params: {
                                        assetName: asset.name ?? '',
                                        assetTag: asset.asset_tag ?? '',
                                        assignedToName: asset.assigned_to?.name ?? '',
                                    },
                                })}
                                >
                                    <Text style={styles.buttonText}>{t('mobile.check_in_button')}</Text>
                                </Pressable>
                            </>
                        ) : (
                            <Pressable
                                style={({pressed}) => [styles.button, styles.checkoutButton, pressed && styles.buttonPressed]}
                                onPress={() => router.push({
                                    pathname: `/(tabs)/(assets)/checkout/${id}`,
                                    params: {
                                        assetName: asset.name ?? '',
                                        assetTag: asset.asset_tag ?? '',
                                        statusId: asset.status_label?.id ?? '',
                                        statusName: asset.status_label?.name ?? '',
                                        statusMeta: asset.status_label?.status_meta ?? '',
                                    },
                                })}
                            >
                                <Text style={styles.buttonText}>{t('mobile.check_out_button')}</Text>
                            </Pressable>
                        )}
                        <Pressable
                            style={({pressed}) => [styles.buttonSmall, styles.auditButton, pressed && styles.buttonPressed]}
                            onPress={() => router.push({
                                pathname: '/(authenticated)/audit/confirm',
                                params: { asset_id: id },
                            })}
                        >
                            <Text style={styles.buttonSmallText}>{t('general.audit')}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Details */}
                <Section title={t('mobile.section_details')}>
                    <DetailRow label={t('general.serial')} value={displayValue(asset.serial)}/>
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
                    <DetailRow label={t('general.purchase_cost')} value={displayValue(asset.purchase_cost)}/>
                    <DetailRow label={t('general.order_number')} value={displayValue(asset.order_number)}/>
                    <DetailRow label={t('general.supplier')} value={nestedName(asset.supplier)}/>
                    <DetailRow label={t('general.warranty_months')} value={asset.warranty_months ? `${asset.warranty_months} months` : na}/>
                    <DetailRow label={t('general.warranty_expires')} value={formatDate(asset.warranty_expires)}/>
                    <DetailRow label={t('general.eol')} value={displayValue(asset.eol)}/>
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
                        {customFields.map(([key, field]) => {
                            const label = key;
                            const format = field.field_format;
                            const element = field.element;

                            if (field.field_encrypted) {
                                return <EncryptedDetailRow key={key} label={label} value={displayValue(field.value)} />;
                            }

                            if (element === 'checkbox' || format === 'boolean') {
                                if (field.field_values) {
                                    const options = typeof field.field_values === 'string'
                                        ? field.field_values.split('\n').map(value => value.trim()).filter(Boolean)
                                        : Array.isArray(field.field_values) ? field.field_values : [];
                                    const selected = field.value ? field.value.split(',').map(value => value.trim()) : [];
                                    return (
                                        <View key={key} style={{gap: Spacing.xs}}>
                                            <Text style={styles.detailLabel}>{label}</Text>
                                            {options.map((option) => (
                                                <View key={option} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                                    <Text style={{fontSize: Typography.body, color: colors.text}}>{option}</Text>
                                                    <Checkbox value={selected.includes(option)} disabled />
                                                </View>
                                            ))}
                                        </View>
                                    );
                                }
                                return (
                                    <View key={key} style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>{label}</Text>
                                        <Checkbox value={field.value === '1'} disabled />
                                    </View>
                                );
                            }

                            if ((element === 'radio' || format === 'radio') && field.field_values) {
                                const options = typeof field.field_values === 'string'
                                    ? field.field_values.split('\n').map(value => value.trim()).filter(Boolean)
                                    : Array.isArray(field.field_values) ? field.field_values : [];
                                return (
                                    <View key={key} style={{gap: Spacing.xs}}>
                                        <Text style={styles.detailLabel}>{label}</Text>
                                        {options.map((option) => (
                                            <View key={option} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                                <Text style={{fontSize: Typography.body, color: colors.text}}>{option}</Text>
                                                <View style={{
                                                    width: 18, height: 18, borderRadius: 9,
                                                    borderWidth: 2,
                                                    borderColor: field.value === option ? colors.primary : colors.textSecondary,
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {field.value === option && (
                                                        <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary}} />
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                );
                            }

                            if ((element === 'listbox' || format === 'listbox') && field.field_values) {
                                const options = typeof field.field_values === 'string'
                                    ? field.field_values.split('\n').map(value => value.trim()).filter(Boolean)
                                    : Array.isArray(field.field_values) ? field.field_values : [];
                                return (
                                    <View key={key} style={{gap: Spacing.xs}}>
                                        <Text style={styles.detailLabel}>{label}</Text>
                                        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm}}>
                                            {options.map((option) => (
                                                <View key={option} style={{
                                                    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                                                    borderRadius: BorderRadius.sm,
                                                    backgroundColor: field.value === option ? colors.primary : colors.backgroundTertiary,
                                                }}>
                                                    <Text style={{
                                                        fontSize: Typography.caption,
                                                        color: field.value === option ? '#fff' : colors.text,
                                                        fontWeight: field.value === option ? FontWeight.semibold : FontWeight.normal,
                                                    }}>{option}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                );
                            }

                            return <DetailRow key={key} label={label} value={displayValue(field.value)}/>;
                        })}
                    </Section>
                )}

                {/* Notes */}
                {asset.notes && (
                    <Section title={t('mobile.section_notes')}>
                        <Text selectable style={styles.notesText}>{asset.notes}</Text>
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
    auditButton: {
        backgroundColor: colors.primary,
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
    buttonSmall: {
        width: '100%',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    buttonSmallText: {
        color: '#fff',
        fontSize: Typography.body,
        fontWeight: FontWeight.medium,
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
