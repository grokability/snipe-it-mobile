import {
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetTextInput,
    useBottomSheet
} from "@gorhom/bottom-sheet";
import {Text, Button, Pressable, View, StyleSheet, Image, ActivityIndicator} from "react-native";
import React, {forwardRef, useMemo, useState, useRef} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {decode} from "html-entities";
import debounce from 'lodash/debounce';

const DEFAULT_SNAP_POINTS = ['25%', '50%', '70%'];

const CloseBtn = () => {
    const { close } = useBottomSheet();
    const { t } = useTranslation();
    return <Button title={t('general.close')} onPress={() => close()} />;
};

// Shared implementation behind all Select*BottomSheet pickers (status, model, category, etc.)
// so fetch/pagination/search/styling stays consistent across the whole family.
const SelectListBottomSheet = forwardRef((props, ref) => {
    const {
        title,
        endpoint,
        onSelect,
        selectedValue,
        avatarStyle = 'square',
        snapPoints: snapPointsProp,
    } = props;

    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const snapPoints = useMemo(() => snapPointsProp ?? DEFAULT_SNAP_POINTS, [snapPointsProp]);
    const [searchText, setSearchText] = useState('');
    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const pageRef = useRef(1);

    const fetchItems = (pageNum, searchQuery = searchText) => {
        if (pageNum === 1) setIsLoading(true);
        makeRequest({
            url: `${endpoint}?search=${searchQuery}&page=${pageNum}`,
            method: 'GET',
            permissionKey: PERMISSIONS.VIEW_SELECTLISTS,
            silent: true,
        })
            .then((res) => {
                const newItems = res?.results ?? [];
                setItems(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
                setHasMore(res?.pagination?.more ?? false);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    };

    const loadMore = () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        pageRef.current += 1;
        fetchItems(pageRef.current);
    };

    const handleSheetAnimate = (fromIndex, toIndex) => {
        if (fromIndex < 0 && toIndex >= 0) {
            pageRef.current = 1;
            fetchItems(1, searchText);
        }
    };

    const debouncedFetch = useRef(debounce((query) => {
        pageRef.current = 1;
        fetchItems(1, query);
    }, 300)).current;

    const handleSearchChange = (text) => {
        setSearchText(text);
        debouncedFetch(text);
    };

    const selectItem = (item) => {
        onSelect({ ...item, name: item.text });
        ref.current?.close();
    };

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
            </Pressable>
        );
    };

    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: colors.background }}
            handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
            onAnimate={(fromIndex, toIndex) => handleSheetAnimate(fromIndex, toIndex)}
            onDismiss={() => { setSearchText(''); setItems([]); }}
        >
            <BottomSheetFlatList
                data={items}
                renderItem={({ item }) => <Item item={item} />}
                keyExtractor={item => item.id}
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                    isLoading ? <ActivityIndicator style={styles.loadingInitial} /> : null
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <View style={styles.searchContainer}>
                            <BottomSheetTextInput
                                style={styles.searchInput}
                                placeholder={t('general.search')}
                                placeholderTextColor={colors.textMuted}
                                onChangeText={handleSearchChange}
                            />
                        </View>
                    </View>
                }
                ListFooterComponent={
                    <>
                        {isLoadingMore && <ActivityIndicator style={styles.loadingMore} />}
                        <CloseBtn />
                    </>
                }
                contentContainerStyle={styles.listContent}
            />
        </BottomSheetModal>
    );
});

const createStyles = (colors) => StyleSheet.create({
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.lg,
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

export default SelectListBottomSheet;
