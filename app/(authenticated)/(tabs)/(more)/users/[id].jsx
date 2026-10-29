import { View, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { useState, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { makeRequest } from "@/helpers/axiosConfig";
import { userKeys } from "@/helpers/queryKeys";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing } from "@/constants/sizes";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/ui/EmptyState";
import { UserDetailSkeleton } from "@/components/ui/Skeleton";
import { useRedirectIfDenied } from "@/permissions/PermissionContext";
import { PERMISSIONS } from "@/permissions/PermissionKeys";

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
            />
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
});
