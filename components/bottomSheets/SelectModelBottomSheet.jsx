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

const SelectModelBottomSheet = forwardRef((props, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();

    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);
    const [searchText, setSearchText] = useState('');
    const [models, setModels] = useState([]);

    useEffect(() => {
        fetchModels();
    }, [searchText]);

    const fetchModels = () => {
        makeRequest({
            url: `/models?search=${searchText}`,
            method: 'GET',
        })
            .then((res) => {
                setModels(res.rows);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const selectModel = (model) => {
        props.setSelectedModel(model);
        ref.current.close();
    };

    const Item = ({item}) => (
        <Pressable
            onPress={() => selectModel(item)}
            style={({pressed}) => [
                styles.itemContainer,
                pressed && styles.itemPressed
            ]}
        >
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{decode(item.name)}</Text>
                {item.model_number && (
                    <Text style={styles.subtitle}>{item.model_number}</Text>
                )}
            </View>
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
                    data={models}
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
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: colors.text,
    },
    subtitle: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        marginTop: Spacing.xs,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
});

export default SelectModelBottomSheet;
