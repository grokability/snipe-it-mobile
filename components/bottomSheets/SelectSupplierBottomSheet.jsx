import {Text, View, StyleSheet, Button, Pressable, Image} from "react-native";
import {BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, useBottomSheet} from "@gorhom/bottom-sheet";
import React, {useMemo, useState, forwardRef, useEffect} from "react";
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

const SelectSupplierBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);
    const [searchText, setSearchText] = useState('');
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        fetchSuppliers();
    }, [searchText]);

    const fetchSuppliers = () => {
        makeRequest({
            url: `/suppliers/selectlist?search=${searchText}`,
            method: 'GET',
            permissionKey: PERMISSIONS.VIEW_SELECTLISTS,
            silent: true,
        })
            .then((res) => {
                setSuppliers(res?.results ?? []);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const selectSupplier = (item) => {
        props.setSelectedSupplier({ ...item, name: item.text });
        ref.current.close();
    };

    const Item = ({item}) => (
        <Pressable
            onPress={() => selectSupplier(item)}
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
    );

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
                data={suppliers}
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
    name: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
        flex: 1,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
});

export default SelectSupplierBottomSheet;
