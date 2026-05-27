import {Text, View, StyleSheet, Button, Pressable, Image, ActivityIndicator} from "react-native";
import {BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, useBottomSheet} from "@gorhom/bottom-sheet";
import React, {useMemo, useState, forwardRef, useRef} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {decode} from "html-entities";
import debounce from 'lodash/debounce';

const CloseBtn = () => {
    const { close } = useBottomSheet();
    const { t } = useTranslation();
    return <Button title={t('general.close')} onPress={() => close()} />;
};

const SelectStatusBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const snapPoints = useMemo(() => ['30%', '50%'], []);
    const [searchText, setSearchText] = useState('')
    const [statuses, setStatuses] = useState([])
    const [hasMore, setHasMore] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const pageRef = useRef(1)

    const fetchStatuses = (pageNum, searchQuery = searchText) => {
        if (pageNum === 1) setIsLoading(true);
        makeRequest({
            url: `/statuslabels/selectlist?search=${searchQuery}&page=${pageNum}`,
            method: 'GET',
            permissionKey: PERMISSIONS.VIEW_SELECTLISTS,
            silent: true,
        })
            .then((res) => {
                const newItems = res?.results ?? [];
                setStatuses(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
                setHasMore(res?.pagination?.more ?? false);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    }

    const loadMore = () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        pageRef.current += 1;
        fetchStatuses(pageRef.current);
    }

    const handleSheetAnimate = (fromIndex, toIndex) => {
        if (fromIndex < 0 && toIndex >= 0) {
            pageRef.current = 1;
            fetchStatuses(1, searchText);
        }
    }

    const debouncedFetch = useRef(debounce((query) => {
        pageRef.current = 1;
        fetchStatuses(1, query);
    }, 300)).current;

    const handleSearchChange = (text) => {
        setSearchText(text);
        debouncedFetch(text);
    }

    const selectStatus = (item) => {
        props.setSelectedStatus({ ...item, name: item.text, value: item.id })
        ref.current.close()
    }

    const Item = ({item}) => (
        <Pressable
            onPress={() => selectStatus(item)}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            {item.image && (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
            )}
            <Text style={styles.name}>{decode(item.text)}</Text>
        </Pressable>
    )

    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: colors.background }}
            handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
            onAnimate={(fromIndex, toIndex) => handleSheetAnimate(fromIndex, toIndex)}
            onDismiss={() => { setSearchText(''); setStatuses([]); }}
        >
            <BottomSheetFlatList
                data={statuses}
                renderItem={({item}) => <Item item={item} />}
                keyExtractor={item => item.id}
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                    isLoading ? <ActivityIndicator style={styles.loadingInitial} /> : null
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>{props.title}</Text>
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
    )
})

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
        padding: Spacing.md,
        marginVertical: Spacing.sm,
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginHorizontal: Spacing.lg,
    },
    itemPressed: {
        backgroundColor: colors.border,
    },
    itemImage: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.sm,
        marginRight: Spacing.md,
    },
    name: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
        flex: 1,
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
})

export default SelectStatusBottomSheet;
