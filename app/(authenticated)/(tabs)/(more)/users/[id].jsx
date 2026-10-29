import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useState, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { useOpenExternalUrl } from "@/hooks/useOpenExternalUrl";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, Typography, FontWeight } from "@/constants/sizes";
import { decode } from "html-entities";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/ui/EmptyState";
import UserBadge from "@/components/users/UserBadge";
import { Section } from "@/components/ui/Section";
import { DetailRow } from "@/components/ui/DetailRow";
import { UserDetailSkeleton } from "@/components/ui/Skeleton";
import { useRedirectIfDenied } from "@/permissions/PermissionContext";
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
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
});
