import {
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetTextInput,
    BottomSheetView,
    useBottomSheet
} from "@gorhom/bottom-sheet";
import {Text, Button, Pressable, View, StyleSheet, Image} from "react-native";
import React, {forwardRef, useContext, useEffect, useMemo, useState, useImperativeHandle} from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useTranslation} from "react-i18next";

const CloseBtn = () => {
    const { close } = useBottomSheet();
    const { t } = useTranslation();
    return <Button title={t('common.close')} onPress={() => close()} />;
};

const SelectAssetBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { user } = useContext(AuthContext);
    const [assets, setAssets] = useState([])
    const [searchText, setSearchText] = useState('')
    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);

    useEffect(() => {
        fetchAssets();
    }, [searchText])

    const fetchAssets = () => {
        makeRequest({
            url: `/hardware?sort=first_name&order=asc&search=${searchText}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
            .then((res) => {
                setAssets(res.rows)
            })
            .catch((err) => {
                console.error(err);
            });
    }

    const selectAsset = (asset) => {
        props.setSelectedAsset(asset)
        ref.current.close()
    }

    const Item = ({item}) => {
        return (
            <Pressable
                onPress={() => selectAsset(item)}
                style={({pressed}) => [
                    styles.itemContainer,
                    pressed && styles.itemPressed
                ]}
            >
                <View style={styles.assetInfoContainer}>
                    <Text style={styles.assetName}>{item.asset_tag}</Text>
                </View>
            </Pressable>
        )
    }

    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: colors.background }}
            handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
        >
            <GestureHandlerRootView style={styles.container}>
                <Text style={styles.title}>{props.title}</Text>
                <View style={styles.searchContainer}>
                    <BottomSheetTextInput
                        style={styles.searchInput}
                        label={t('common.search')}
                        placeholder={t('common.search')}
                        placeholderTextColor={colors.textMuted}
                        onChangeText={(text) => {setSearchText(text)}}
                    />
                </View>
                <BottomSheetFlatList
                    data={assets}
                    renderItem={({item}) => <Item item={item} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
                <CloseBtn />
            </GestureHandlerRootView>
        </BottomSheetModal>
    )
})

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
        backgroundColor: colors.background,
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
        padding: Spacing.md,
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
    placeholderText: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.bold,
        color: colors.textMuted,
    },
    assetInfoContainer: {
        flex: 1,
    },
    assetName: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
});

export default SelectAssetBottomSheet;
