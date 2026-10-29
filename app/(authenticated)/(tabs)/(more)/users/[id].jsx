import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useState, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius, Typography, FontWeight } from "@/constants/sizes";
import { decode } from "html-entities";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/ui/EmptyState";
import { UserDetailSkeleton } from "@/components/ui/Skeleton";
import { useRedirectIfDenied } from "@/permissions/PermissionContext";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

const AVATAR_SIZE = 120;

export default function UserScreen() {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { id } = useLocalSearchParams();

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
                        {user.role === 'superadmin' && (
                            <View style={[styles.badge, styles.superuserBadge]}>
                                <Text style={[styles.badgeText, styles.superuserBadgeText]}>{t('general.superuser')}</Text>
                            </View>
                        )}
                        {user.role === 'admin' && (
                            <View style={[styles.badge, styles.adminBadge]}>
                                <Text style={[styles.badgeText, styles.adminBadgeText]}>{t('general.admin_user')}</Text>
                            </View>
                        )}
                        {user.vip && (
                            <View style={[styles.badge, styles.vipBadge]}>
                                <Text style={[styles.badgeText, styles.vipBadgeText]}>{t('admin.users.general.vip_label')}</Text>
                            </View>
                        )}
                        {!user.activated && (
                            <View style={[styles.badge, styles.loginDisabledBadge]}>
                                <Text style={[styles.badgeText, styles.loginDisabledBadgeText]}>{t('general.login_disabled')}</Text>
                            </View>
                        )}
                    </View>
                </View>
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
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    badgeText: {
        fontSize: Typography.caption,
        fontWeight: FontWeight.semibold,
    },
    superuserBadge: {
        backgroundColor: colors.danger + '20',
    },
    superuserBadgeText: {
        color: colors.danger,
    },
    adminBadge: {
        backgroundColor: colors.warning + '20',
    },
    adminBadgeText: {
        color: colors.warning,
    },
    vipBadge: {
        backgroundColor: colors.primary + '20',
    },
    vipBadgeText: {
        color: colors.primary,
    },
    loginDisabledBadge: {
        backgroundColor: colors.danger + '20',
    },
    loginDisabledBadgeText: {
        color: colors.danger,
    },
});
