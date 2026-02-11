import {Text, View, StyleSheet, Button, Pressable} from "react-native";
import {BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, useBottomSheet} from "@gorhom/bottom-sheet";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import React, {useMemo, useState, forwardRef, useContext, useEffect} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

const CloseBtn = () => {
    const { close } = useBottomSheet();
    const { t } = useTranslation();
    return <Button title={t('general.close')} onPress={() => close()} />;
};

const SelectStatusBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const { user } = useContext(AuthContext);
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
            headers: { 'Authorization': `Bearer ${user.token}` }
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
            <Text style={styles.name}>{item.name}</Text>
        </Pressable>
    )

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
                        label={t('general.search')}
                        placeholder={t('general.search')}
                        placeholderTextColor={colors.textMuted}
                        onChangeText={(text) => {setSearchText(text)}}
                    />
                </View>
                <BottomSheetFlatList
                    data={statuses}
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
        backgroundColor: colors.background,
        padding: Spacing.lg,
        borderRadius: BorderRadius.sm,
        elevation: 4,
        shadowColor: '#000',
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
        paddingBottom: 50,
    }
})

export default SelectStatusBottomSheet;
