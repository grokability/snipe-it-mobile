import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius, Typography, FontWeight } from "@/constants/sizes";
import { decode } from "html-entities";
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/ui/EmptyState";
import UserBadge from "@/components/users/UserBadge";
import { Section } from "@/components/ui/Section";
import { DetailRow } from "@/components/ui/DetailRow";
import { UserDetailSkeleton } from "@/components/ui/Skeleton";
import { usePermission, useRedirectIfDenied } from "@/permissions/PermissionContext";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

const AVATAR_SIZE = 120;

// Laid out as Snipe-IT's Presenter::displayAddress(): street, then "city, state zip country"
const formatAddress = (user) => {
    const cityLine = [user.city && `${user.city},`, user.state, user.zip, user.country]
        .filter((addressPart) => Boolean(addressPart))
        .join(' ');

    return [user.address, cityLine]
        .filter((addressLine) => Boolean(addressLine))
        .map((addressLine) => decode(addressLine))
        .join('\n');
};

// The platform's maps app, searched with the same query the web user page sends to Apple / Google Maps
const buildMapsUrl = (user) => {
    const query = encodeURIComponent(
        [user.address, user.city, user.state, user.country, user.zip]
            .filter((addressPart) => Boolean(addressPart))
            .map((addressPart) => decode(addressPart))
            .join(',')
    );

    if (Platform.OS === 'ios') {
        return `https://maps.apple.com/?q=${query}`;
    }

    return `geo:0,0?q=${query}`;
};

// End dates turn red on the web user page once the day has started (end_date < now)
const isPastEndDate = (endDate) => {
    if (!endDate?.date) {
        return false;
    }

    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-');

    return endDate.date <= today;
};

// Notes arrive as inline Markdown rendered to HTML; show them as plain text
const formatNotes = (notes) => decode(
    notes
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
);

// Websites are free text in Snipe-IT; "example.com" needs a scheme before Linking can open it
const buildWebsiteUrl = (website) => {
    if (/^[a-z][a-z\d+.-]*:/i.test(website)) {
        return website;
    }

    return `https://${website}`;
};

export default function UserScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { id } = useLocalSearchParams();
    const openUrl = useOpenExternalUrl();

    useRedirectIfDenied(PERMISSIONS.USERS_VIEW);

    const { denied: assetsDenied } = usePermission(PERMISSIONS.ASSETS_VIEW);
    const { denied: licensesDenied } = usePermission(PERMISSIONS.LICENSES_VIEW);
    const { denied: accessoriesDenied } = usePermission(PERMISSIONS.ACCESSORIES_VIEW);
    const { denied: consumablesDenied } = usePermission(PERMISSIONS.CONSUMABLES_VIEW);
    const { denied: reportsDenied } = usePermission(PERMISSIONS.REPORTS_VIEW);

    const userQuery = useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => makeRequest({ url: `/users/${id}`, method: 'get', permissionKey: PERMISSIONS.USERS_VIEW }),
    });

    useRefreshOnFocus(userKeys.detail(id));

    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const onManualRefresh = async () => {
        setIsManualRefreshing(true);
        await userQuery.refetch();
        setIsManualRefreshing(false);
    };

    // Snipe-IT answers a missing (or deleted) user with HTTP 200 and { status: 'error' }, not a 404
    const userNotFound = userQuery.data?.status === 'error';

    const user = userQuery.data;

    if (userNotFound) {
        return (
            <View style={styles.container}>
                <EmptyState
                    icon="alert-circle-outline"
                    title={t('general.generic_model_not_found', { model: t('general.user') })}
                    message={null}
                />
            </View>
        );
    }

    if (!user) {
        return <UserDetailSkeleton />;
    }

    const na = t('mobile.na');
    const displayValue = (value) => value ? decode(String(value)) : na;
    const nestedName = (object) => object?.name ? decode(object.name) : na;
    const formatDate = (dateObject) => dateObject?.formatted ?? na;
    const formatBool = (value) => value ? t('mobile.yes') : t('mobile.no');

    const groupNames = (user.groups?.rows ?? [])
        .map((group) => decode(group.name))
        .join(', ');
    const hasManyCompanies = (user.companies?.length ?? 0) > 1;
    const companyNames = hasManyCompanies
        ? user.companies.map((company) => decode(company.name)).join(', ')
        : nestedName(user.company);

    // One row per list the caller may view, as the web user page's tabs. Icons match the tab bar and More menu
    const drillInRows = [
        { key: 'assets', icon: 'barcode', label: t('general.assets'), count: user.assets_count, denied: assetsDenied, route: `/(more)/users/${id}/assets` },
        { key: 'licenses', icon: 'file-text-o', label: t('general.licenses'), count: user.licenses_count, denied: licensesDenied },
        { key: 'accessories', icon: 'keyboard-o', label: t('general.accessories'), count: user.accessories_count, denied: accessoriesDenied },
        { key: 'consumables', icon: 'tint', label: t('general.consumables'), count: user.consumables_count, denied: consumablesDenied },
        { key: 'history', icon: 'history', label: t('general.history'), denied: reportsDenied },
    ].filter((row) => !row.denied);

    const address = formatAddress(user);
    const hasContactDetails = Boolean(user.email || user.phone || user.mobile || user.website) || address !== '';

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.container}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.contentContainer, { paddingTop: Platform.OS === 'android' ? insets.top + 56 : 0 }]}
                refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={onManualRefresh} />}
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    {user.avatar
                        ? (
                            <Image
                                style={styles.avatar}
                                source={{ uri: user.avatar }}
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        )
                        : <Ionicons name="person-circle-outline" size={AVATAR_SIZE} color={colors.textSecondary} />
                    }
                    <Text style={styles.title}>{decode(user.name)}</Text>
                    {Boolean(user.jobtitle) && (
                        <Text style={styles.subtitle}>{decode(user.jobtitle)}</Text>
                    )}
                    <View style={styles.badgeRow}>
                        <UserBadge user={user} />
                    </View>
                </View>

                {/* Contact */}
                {hasContactDetails && (
                    <Section title={t('general.contact')}>
                        {Boolean(user.email) && (
                            <DetailRow
                                label={t('general.email')}
                                value={decode(user.email)}
                                onPress={() => openUrl(`mailto:${decode(user.email)}`)}
                            />
                        )}
                        {Boolean(user.phone) && (
                            <DetailRow
                                label={t('general.phone')}
                                value={decode(user.phone)}
                                onPress={() => openUrl(`tel:${decode(user.phone).replace(/[^\d+]/g, '')}`)}
                            />
                        )}
                        {Boolean(user.mobile) && (
                            <DetailRow
                                label={t('admin.users.table.mobile')}
                                value={decode(user.mobile)}
                                onPress={() => openUrl(`tel:${decode(user.mobile).replace(/[^\d+]/g, '')}`)}
                            />
                        )}
                        {Boolean(user.website) && (
                            <DetailRow
                                label={t('general.website')}
                                value={decode(user.website)}
                                onPress={() => openUrl(buildWebsiteUrl(decode(user.website)))}
                            />
                        )}
                        {address !== '' && (
                            <DetailRow
                                label={t('general.address')}
                                value={address}
                                onPress={() => openUrl(buildMapsUrl(user))}
                            />
                        )}
                    </Section>
                )}

                {/* Assigned items and history */}
                {drillInRows.length > 0 && (
                    <View style={styles.drillInCard}>
                        {drillInRows.map((row, index) => (
                            <Pressable
                                key={row.key}
                                onPress={row.route ? () => router.push(row.route) : undefined}
                                style={({ pressed }) => [
                                    styles.drillInRow,
                                    index < drillInRows.length - 1 && styles.drillInRowDivider,
                                    pressed && styles.drillInRowPressed,
                                ]}
                            >
                                <FontAwesome name={row.icon} size={20} color={colors.text} style={styles.drillInIcon} />
                                <Text style={styles.drillInLabel}>{row.label}</Text>
                                {row.count !== undefined && (
                                    <Text style={styles.drillInCount}>{row.count}</Text>
                                )}
                                <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Details */}
                <Section title={t('mobile.section_details')}>
                    <DetailRow label={t('general.username')} value={displayValue(user.username)} />
                    {Boolean(user.display_name) && (
                        <DetailRow label={t('admin.users.table.display_name')} value={decode(user.display_name)} />
                    )}
                    <DetailRow label={t('admin.users.table.employee_num')} value={displayValue(user.employee_num)} />
                    <DetailRow label={t('general.groups')} value={groupNames || na} />
                    <DetailRow label={t('admin.users.general.remote')} value={formatBool(user.remote)} />
                    <DetailRow label={t('admin.settings.general.ldap_enabled')} value={formatBool(user.ldap_import)} />
                    <DetailRow label={t('admin.users.general.two_factor_enrolled')} value={formatBool(user.two_factor_enrolled)} />
                </Section>

                {/* Organization */}
                <Section title={t('mobile.section_organization')}>
                    <DetailRow label={hasManyCompanies ? t('general.companies') : t('general.company')} value={companyNames} />
                    <DetailRow label={t('general.department')} value={nestedName(user.department)} />
                    <DetailRow label={t('general.location')} value={nestedName(user.location)} />
                    <DetailRow label={t('admin.users.table.manager')} value={nestedName(user.manager)} />
                </Section>

                {/* Dates */}
                <Section title={t('mobile.section_dates')}>
                    <DetailRow label={t('general.last_login')} value={formatDate(user.last_login)} />
                    <DetailRow label={t('general.start_date')} value={formatDate(user.start_date)} />
                    <DetailRow
                        label={t('general.end_date')}
                        value={formatDate(user.end_date)}
                        valueStyle={isPastEndDate(user.end_date) && styles.pastEndDate}
                    />
                    <DetailRow label={t('general.created_at')} value={formatDate(user.created_at)} />
                </Section>

                {/* Notes */}
                {Boolean(user.notes) && (
                    <Section title={t('mobile.section_notes')}>
                        <Text selectable style={styles.notesText}>{formatNotes(user.notes)}</Text>
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
    headerContainer: {
        alignItems: 'center',
        gap: Spacing.sm,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: colors.backgroundSecondary,
    },
    title: {
        fontSize: Typography.titleLarge,
        fontWeight: FontWeight.bold,
        color: colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    drillInCard: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    drillInRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    drillInRowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    drillInRowPressed: {
        backgroundColor: colors.backgroundTertiary,
    },
    drillInIcon: {
        width: 24,
        textAlign: 'center',
        marginRight: Spacing.md,
    },
    drillInLabel: {
        flex: 1,
        fontSize: Typography.body,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    drillInCount: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        marginRight: Spacing.sm,
    },
    pastEndDate: {
        color: colors.danger,
    },
    notesText: {
        fontSize: Typography.bodyLarge,
        color: colors.text,
        lineHeight: Typography.bodyLarge * 1.5,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
});
