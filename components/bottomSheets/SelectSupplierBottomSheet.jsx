import {Text, View, StyleSheet, Button, Pressable} from "react-native";
import {BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, useBottomSheet} from "@gorhom/bottom-sheet";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import React, {useMemo, useState, forwardRef, useEffect} from "react";
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
            url: `/suppliers?search=${searchText}`,
            method: 'GET',
        })
            .then((res) => {
                setSuppliers(res.rows);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const selectSupplier = (supplier) => {
        props.setSelectedSupplier(supplier);
        ref.current.close();
    };

    const Item = ({item}) => (
        <Pressable
            onPress={() => selectSupplier(item)}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.bottom_sheet_item', {name: decode(item.name)})}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            <Text style={styles.name}>{decode(item.name)}</Text>
        </Pressable>
    );

    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: colors.background }}
            handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
        >
            <GestureHandlerRootView style={styles.container} accessibilityViewIsModal={true}>
                <Text style={styles.title}>{props.title}</Text>
                <View style={styles.searchContainer}>
                    <BottomSheetTextInput
                        style={styles.searchInput}
                        label={t('general.search')}
                        placeholder={t('general.search')}
                        placeholderTextColor={colors.textMuted}
                        accessibilityLabel={t('a11y.search_input', {context: props.title})}
                        onChangeText={(text) => {setSearchText(text)}}
                    />
                </View>
                <BottomSheetFlatList
                    data={suppliers}
                    renderItem={({item}) => <Item item={item} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
                <CloseBtn />
            </GestureHandlerRootView>
        </BottomSheetModal>
    );
});

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
    name: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
});

export default SelectSupplierBottomSheet;
