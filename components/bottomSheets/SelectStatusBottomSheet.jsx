import {Text, View, StyleSheet, Button, Pressable} from "react-native";
import {BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, useBottomSheet} from "@gorhom/bottom-sheet";
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

const SelectStatusBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const snapPoints = useMemo(() => ['30%', '50%'], []);
    const [searchText, setSearchText] = useState('')
    const [statuses, setStatuses] = useState([])

    useEffect(() => {
        fetchStatuses();
    }, [searchText])

    const fetchStatuses = () => {
        makeRequest({
            url: `statuslabels?search=${searchText}`,
            method: 'GET',
        })
            .then((res) => {
                setStatuses(res.rows)
            })
            .catch((err) => {
                console.error(err);
            });
    }

    const selectStatus = (status) => {
        props.setSelectedStatus(status)
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
            <Text style={styles.name}>{decode(item.name)}</Text>
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
                data={statuses}
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
    name: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
})

export default SelectStatusBottomSheet;
