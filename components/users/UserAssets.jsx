import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'html-entities';
import { useTranslation } from 'react-i18next';
import { makeRequest } from '@/helpers/axiosConfig';
import { userKeys } from '@/helpers/queryKeys';
import { useColors } from '@/hooks/useThemeColors';
import { Spacing, BorderRadius, Typography, FontWeight } from '@/constants/sizes';
import { PERMISSIONS } from '@/permissions/PermissionKeys';

const PAGE_SIZE = 50;

// The assets checked out to a user. Newer servers page /users/{id}/assets; older ones return
// every row at once, which the total check below treats as the last page. Its key sits under
// userKeys.detail(id), so the User screen's refreshes reach it too.
export default function UserAssets({ userId }) {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const assetsQuery = useInfiniteQuery({
        queryKey: userKeys.assets(userId),
        queryFn: ({ pageParam }) => makeRequest({
            url: `/users/${userId}/assets?limit=${PAGE_SIZE}&offset=${pageParam}`,
            method: 'get',
            permissionKey: PERMISSIONS.ASSETS_VIEW,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((count, page) => count + (page.rows?.length ?? 0), 0);

            if (!lastPage?.rows?.length || loadedCount >= (lastPage.total ?? 0)) {
                return undefined;
            }

            return loadedCount;
        },
    });

    const assets = useMemo(
        () => assetsQuery.data?.pages.flatMap((page) => page.rows ?? []) ?? [],
        [assetsQuery.data]
    );

    if (assetsQuery.isPending) {
        return (
            <View style={styles.card}>
                <ActivityIndicator color={colors.textSecondary} style={styles.loading} />
            </View>
        );
    }

    if (assets.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.emptyText}>{t('admin.users.message.user_has_no_assets_assigned')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {assets.map((asset, index) => {
                const isDeployable = asset.status_label?.status_type === 'deployable';

                return (
                    <Pressable
                        key={asset.id}
                        onPress={() => router.push(`/(authenticated)/(tabs)/(assets)/${asset.id}`)}
                        style={({ pressed }) => [
                            styles.row,
                            index < assets.length - 1 && styles.rowDivider,
                            pressed && styles.rowPressed,
                        ]}
                    >
                        <View style={styles.rowContent}>
                            <Text style={styles.assetTag}>#{decode(asset.asset_tag)}</Text>
                            <Text style={styles.assetName} numberOfLines={1}>
                                {decode(asset.name || asset.model?.name || '')}
                            </Text>
                            {Boolean(asset.status_label?.name) && (
                                <Text style={isDeployable ? styles.availableText : styles.notAvailableText}>
                                    {decode(asset.status_label.name)}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </Pressable>
                );
            })}
            {assetsQuery.hasNextPage && (
                <Pressable
                    onPress={() => assetsQuery.fetchNextPage()}
                    disabled={assetsQuery.isFetchingNextPage}
                    style={styles.showMoreButton}
                >
                    {assetsQuery.isFetchingNextPage
                        ? <ActivityIndicator color={colors.primary} />
                        : <Text style={styles.showMoreText}>{t('mobile.show_more')}</Text>
                    }
                </Pressable>
            )}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    loading: {
        padding: Spacing.lg,
    },
    emptyText: {
        padding: Spacing.lg,
        fontSize: Typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    rowPressed: {
        backgroundColor: colors.backgroundTertiary,
    },
    rowContent: {
        flex: 1,
        gap: 2,
    },
    assetTag: {
        fontSize: Typography.caption,
        color: colors.textSecondary,
    },
    assetName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
        color: colors.text,
    },
    availableText: {
        fontSize: Typography.caption,
        color: colors.success,
        fontWeight: FontWeight.medium,
    },
    notAvailableText: {
        fontSize: Typography.caption,
        color: colors.danger,
        fontWeight: FontWeight.medium,
    },
    showMoreButton: {
        padding: Spacing.md,
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    showMoreText: {
        fontSize: Typography.body,
        color: colors.primary,
        fontWeight: FontWeight.medium,
    },
});
