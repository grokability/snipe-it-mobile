import { BottomSheetTextInput } from "@expo/ui/community/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Text, Pressable, View, StyleSheet, Image, ActivityIndicator } from "react-native";
import React, { useMemo } from "react";
import { useColors } from "@/hooks/useThemeColors";
import { Spacing, BorderRadius, Typography, FontWeight } from "@/constants/sizes";
import { useTranslation } from "react-i18next";
import { decode } from "html-entities";

// Presentational picker list (search + paginated items + pinned selected item). Rendered either
// as the sole content of a standalone SelectListBottomSheet modal, or embedded as drill-down
// content inside AssetFilterBottomSheet — so it takes all data/handlers as props and has no
// opinion on what "done" means (that's the headerAction prop, wired up by the caller).
// It sits next to the title rather than at the list's end, since with infinite scroll
// the footer position becomes unreachable as more pages load.
const SelectListContent = ({
    title,
    avatarStyle = 'square',
    selectedValue,
    displayItems,
    isLoading,
    isLoadingMore,
    pinnedItem,
    loadMore,
    handleSearchChange,
    selectItem,
    headerAction,
}) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const ItemContent = ({ item }) => (
        <>
            {avatarStyle === 'circle' ? (
                <View style={styles.avatarContainer}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarPlaceholderText}>
                                {item.text ? decode(item.text).charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                item.image && (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                )
            )}
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{decode(item.text)}</Text>
            </View>
        </>
    );

    const Item = ({ item }) => {
        const isSelected = selectedValue?.id != null && selectedValue.id === item.id;
        return (
            <Pressable
                onPress={() => selectItem(item)}
                style={({ pressed }) => [
                    styles.itemContainer,
                    isSelected && styles.itemSelected,
                    pressed && styles.itemPressed,
                ]}
            >
                <ItemContent item={item} />
            </Pressable>
        );
    };

    const PinnedItem = ({ item }) => (
        <Pressable
            onPress={() => selectItem(item)}
            style={({ pressed }) => [
                styles.itemContainer,
                styles.itemSelected,
                pressed && styles.itemPressed,
            ]}
        >
            <ItemContent item={item} />
        </Pressable>
    );

    return (
        <FlashList
            data={displayItems}
            renderItem={({ item }) => <Item item={item} />}
            keyExtractor={item => item.id}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={
                isLoading ? <ActivityIndicator style={styles.loadingInitial} /> : null
            }
            ListHeaderComponent={
                <>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={styles.title}>{title}</Text>
                            {headerAction}
                        </View>
                        <View style={styles.searchContainer}>
                            <BottomSheetTextInput
                                style={styles.searchInput}
                                placeholder={t('general.search')}
                                placeholderTextColor={colors.textMuted}
                                onChangeText={handleSearchChange}
                            />
                        </View>
                    </View>
                    {pinnedItem && <PinnedItem item={pinnedItem} />}
                </>
            }
            ListFooterComponent={
                <>
                    {isLoadingMore && <ActivityIndicator style={styles.loadingMore} />}
                </>
            }
            contentContainerStyle={styles.listContent}
        />
    );
};

const createStyles = (colors) => StyleSheet.create({
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        color: colors.text,
    },
    searchContainer: {
        marginBottom: Spacing.lg,
    },
    searchInput: {
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        backgroundColor: colors.backgroundTertiary,
        fontSize: Typography.bodyLarge,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
    },
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: 'transparent',
    },
    itemSelected: {
        backgroundColor: colors.backgroundSecondary,
        borderLeftColor: colors.primary,
    },
    itemPressed: {
        backgroundColor: colors.backgroundTertiary,
    },
    itemImage: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.sm,
        marginRight: Spacing.md,
    },
    avatarContainer: {
        marginRight: Spacing.md,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.bold,
        color: colors.textMuted,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    loadingInitial: {
        paddingVertical: Spacing.xl,
    },
    loadingMore: {
        paddingVertical: Spacing.md,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
});

export default SelectListContent;
