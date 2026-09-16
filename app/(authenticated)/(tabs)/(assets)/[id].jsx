import React, {useMemo, useLayoutEffect, useState} from 'react';
import {ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Image} from 'expo-image';
import {router, useLocalSearchParams, useNavigation} from "expo-router";
import {useQuery} from '@tanstack/react-query';
import {Ionicons} from '@expo/vector-icons';
import {makeRequest} from "@/helpers/axiosConfig";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {assetKeys, customFieldKeys} from "@/helpers/queryKeys";
import {useRefreshOnFocus} from "@/hooks/useRefreshOnFocus";
import {AssetDetailSkeleton} from "@/components/ui/Skeleton";
import {decode} from "html-entities";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import Checkbox from "@/components/forms/Checkbox";
import {Section, SectionHeader} from "@/components/ui/Section";
import {DetailRow, EncryptedDetailRow} from "@/components/ui/DetailRow";
import {usePermission} from "@/permissions/PermissionContext";
import {PermissionGate} from "@/permissions/PermissionGate";


export const unstable_settings = {
    initialRouteName: 'index',
};

// Merges field_values_array and field_encrypted from the /fields definitions into the asset's
// custom_fields, without mutating either query's cached data.
function mergeCustomFields(asset, fieldsRes) {
    if (!asset?.custom_fields || !fieldsRes?.rows) return asset;
    const fieldDefs = {};
    fieldsRes.rows.forEach(fieldDefinition => {
        fieldDefs[fieldDefinition.db_column_name] = fieldDefinition;
    });
    const custom_fields = {};
    Object.entries(asset.custom_fields).forEach(([key, field]) => {
        const fieldDefinition = fieldDefs[field.field];
        custom_fields[key] = fieldDefinition
            ? {
                ...field,
                field_values: fieldDefinition.field_values_array ?? field.field_values,
                field_encrypted: Boolean(fieldDefinition.field_encrypted),
            }
            : field;
    });
    return {...asset, custom_fields};
}

export default function AssetScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { denied: createDenied } = usePermission(PERMISSIONS.ASSETS_CREATE);
    const { denied: editDenied } = usePermission(PERMISSIONS.ASSETS_EDIT);

    const { id } = useLocalSearchParams();
    const navigation = useNavigation();

    const assetQuery = useQuery({
        queryKey: assetKeys.detail(id),
        queryFn: () => makeRequest({ url: `/hardware/${id}`, method: 'get', permissionKey: PERMISSIONS.ASSETS_VIEW }),
    });

    const fieldsQuery = useQuery({
        queryKey: customFieldKeys.all,
        queryFn: () => makeRequest({ url: '/fields', method: 'get', permissionKey: PERMISSIONS.CUSTOMFIELDS_VIEW }),
        staleTime: Infinity, // i'm not sure i like this - we might just make it 24 hours or something but maybe i'm wrong /shrug
    });

    useRefreshOnFocus(assetKeys.detail(id));

    const [isImageLoading, setIsImageLoading] = useState(true);
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const onManualRefresh = async () => {
        setIsManualRefreshing(true);
        await assetQuery.refetch();
        setIsManualRefreshing(false);
    };

    const asset = useMemo(
        () => mergeCustomFields(assetQuery.data, fieldsQuery.data),
        [assetQuery.data, fieldsQuery.data]
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerButtonGroup}>
                    {!createDenied && (
                        <Pressable onPress={() => router.push('/(tabs)/(assets)/create')} hitSlop={4}>
                            <Ionicons name="add" size={26} color={colors.text} />
                        </Pressable>
                    )}
                    {!editDenied && (
                        <Pressable onPress={() => router.push(`/(tabs)/(assets)/edit/${id}`)} hitSlop={4}>
                            <Ionicons name="pencil" size={22} color={colors.text} />
                        </Pressable>
                    )}
                </View>
            ),
        });
    }, [navigation, id, colors.text, createDenied, editDenied]);

    const na = t('mobile.na');
    const displayValue = (value) => value ? decode(String(value)) : na;
    const nestedName = (object) => object?.name ? decode(object.name) : na;
    const formatDate = (dateObject) => dateObject?.formatted || na;
    const formatBool = (value) => value ? t('mobile.yes') : t('mobile.no');

    if (!asset) {
        return <AssetDetailSkeleton />;
    }

    const cannotCheckout = ['undeployable', 'archived'].includes(asset.status_label?.status_type);
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
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.contentContainer, {paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0}]}
                refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={onManualRefresh} />}
            >
                {/* Image */}
                {asset.image && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{uri: asset.image}}
                            style={styles.image}
                            transition={200}
                            cachePolicy="memory-disk"
                            onLoadStart={() => setIsImageLoading(true)}
                            onLoadEnd={() => setIsImageLoading(false)}
                        />
                        {isImageLoading && (
                            <ActivityIndicator style={styles.imageLoadingIndicator} color={colors.textSecondary} />
                        )}
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
                                <PermissionGate permission={PERMISSIONS.ASSETS_CHECKIN}>
                                    <Pressable
                                        style={({pressed}) => [styles.button, styles.checkinButton, pressed && styles.buttonPressed]}
                                        onPress={() => router.push({
                                        pathname: `/(tabs)/(assets)/checkin/${id}`,
                                        params: {
                                            assetName: asset.name ?? '',
                                            assetTag: asset.asset_tag ?? '',
                                            assignedToName: asset.assigned_to?.name ?? '',
                                            statusId: asset.status_label?.id ?? '',
                                            statusName: asset.status_label?.name ?? '',
                                        },
                                    })}
                                    >
                                        <Text style={styles.buttonText}>{t('mobile.check_in_button')}</Text>
                                    </Pressable>
                                </PermissionGate>
                            </>
                        ) : (
                            <>
                                <PermissionGate permission={PERMISSIONS.ASSETS_CHECKOUT}>
                                    <>
                                        <Pressable
                                            disabled={cannotCheckout}
                                            style={({pressed}) => [
                                                styles.button,
                                                styles.checkoutButton,
                                                pressed && !cannotCheckout && styles.buttonPressed,
                                                cannotCheckout && styles.buttonDisabled,
                                            ]}
                                            onPress={cannotCheckout ? undefined : () => router.push({
                                                pathname: `/(tabs)/(assets)/checkout/${id}`,
                                                params: {
                                                    assetName: asset.name ?? '',
                                                    assetTag: asset.asset_tag ?? '',
                                                    statusId: asset.status_label?.id ?? '',
                                                    statusName: asset.status_label?.name ?? '',
                                                    statusType: asset.status_label?.status_type ?? '',
                                                },
                                            })}
                                        >
                                            <Text style={styles.buttonText}>{t('mobile.check_out_button')}</Text>
                                        </Pressable>
                                        {cannotCheckout && (
                                            <Text style={styles.undeployableMessage}>
                                                {t('mobile.undeployable_checkout_message')}
                                            </Text>
                                        )}
                                    </>
                                </PermissionGate>
                            </>
                        )}
                        <PermissionGate permission={PERMISSIONS.ASSETS_AUDIT}>
                            <Pressable
                                style={({pressed}) => [styles.buttonSmall, styles.auditButton, pressed && styles.buttonPressed]}
                                onPress={() => router.push({
                                    pathname: '/(authenticated)/audit/confirm',
                                    params: { asset_id: id },
                                })}
                            >
                                <Text style={styles.buttonSmallText}>{t('general.audit')}</Text>
                            </Pressable>
                        </PermissionGate>
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
                <PermissionGate permission={PERMISSIONS.CUSTOMFIELDS_VIEW}>
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
                </PermissionGate>

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
        position: 'relative',
    },
    image: {
        width: 250,
        height: 250,
        borderRadius: BorderRadius.md,
    },
    imageLoadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -10,
        marginLeft: -10,
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
    buttonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.7,
    },
    undeployableMessage: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
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
