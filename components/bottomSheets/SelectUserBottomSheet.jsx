import {
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetTextInput,
    useBottomSheet
} from "@gorhom/bottom-sheet";
import {Text, Button, Pressable, View, StyleSheet, Image, ActivityIndicator} from "react-native";
import React, {forwardRef, useEffect, useMemo, useState, useRef} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {PERMISSIONS} from "@/permissions/PermissionKeys";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {decode} from "html-entities";

const CloseBtn = () => {
    const { close } = useBottomSheet();
    const { t } = useTranslation();
    return <Button title={t('general.close')} onPress={() => close()} />;
};

const SelectUserBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const [users, setUsers] = useState([])
    const [searchText, setSearchText] = useState('')
    const [hasMore, setHasMore] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const pageRef = useRef(1)
    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);

    useEffect(() => {
        pageRef.current = 1;
        fetchUsers(1);
    }, [searchText])

    const fetchUsers = (pageNum) => {
        makeRequest({
            url: `/users/selectlist?search=${searchText}&page=${pageNum}`,
            method: 'GET',
            permissionKey: PERMISSIONS.VIEW_SELECTLISTS,
            silent: true,
        })
            .then((res) => {
                const newItems = res?.results ?? [];
                setUsers(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
                setHasMore(res?.pagination?.more ?? false);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setIsLoadingMore(false);
            });
    }

    const loadMore = () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        pageRef.current += 1;
        fetchUsers(pageRef.current);
    }

    const selectUser = (item) => {
        props.setSelectedUser({ ...item, name: item.text, avatar: item.image })
        ref.current.close()
    }

    const Item = ({item}) => (
        <Pressable
            onPress={() => selectUser(item)}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.userImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>
                            {item.text ? decode(item.text).charAt(0).toUpperCase() : "U"}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.userInfoContainer}>
                <Text style={styles.userName}>{decode(item.text)}</Text>
            </View>
        </Pressable>
    )

    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: colors.background }}
            handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
            onDismiss={() => setSearchText('')}
        >
            <BottomSheetFlatList
                data={users}
                renderItem={({item}) => <Item item={item} />}
                keyExtractor={item => item.id}
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>{props.title}</Text>
                        <View style={styles.searchContainer}>
                            <BottomSheetTextInput
                                style={styles.searchInput}
                                placeholder={t('general.search')}
                                placeholderTextColor={colors.textMuted}
                                onChangeText={(text) => {setSearchText(text)}}
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
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemPressed: {
        backgroundColor: colors.backgroundTertiary,
    },
    imageContainer: {
        marginRight: Spacing.md,
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
    },
    placeholderImage: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.bold,
        color: colors.textMuted,
    },
    userInfoContainer: {
        flex: 1,
    },
    userName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    loadingMore: {
        paddingVertical: Spacing.md,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
});

export default SelectUserBottomSheet;
