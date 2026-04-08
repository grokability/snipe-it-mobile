import {
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetTextInput,
    useBottomSheet
} from "@gorhom/bottom-sheet";
import {Text, Button, Pressable, View, StyleSheet} from "react-native";
import React, {forwardRef, useEffect, useMemo, useState} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";
import {decode} from "html-entities";

const CloseBtn = () => {
    const { close } = useBottomSheet();
    const { t } = useTranslation();
    return <Button title={t('general.close')} onPress={() => close()} />;
};

const SelectAssetBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

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

    const Item = ({item}) => (
        <Pressable
            onPress={() => selectAsset(item)}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            <View style={styles.assetInfoContainer}>
                <Text style={styles.assetName}>{decode(item.asset_tag)}</Text>
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
                data={assets}
                renderItem={({item}) => <Item item={item} />}
                keyExtractor={item => item.id}
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
                ListFooterComponent={<CloseBtn />}
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
