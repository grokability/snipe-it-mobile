import {Text, View, StyleSheet, Button, Pressable} from "react-native";
import {BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, useBottomSheet} from "@gorhom/bottom-sheet";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import React, {useMemo, useState, forwardRef, useContext, useEffect} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import {Colors} from "@/constants/colors";
import {Spacing, BorderRadius, Typography, FontWeight} from "@/constants/sizes";

const CloseBtn = () => {
    const { close } = useBottomSheet();

    return <Button title="Close" onPress={() => close()} />;
};

const SelectStatusBottomSheet = forwardRef((props, ref) => {
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
            })
            .finally(() => {
                // Hide the loading animation
                // setLoading(false);
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
        >
            <GestureHandlerRootView style={styles.container}>
                <Text style={styles.title}>{props.title}</Text>
                {/* we use BottomSheetTextInput to make the BottomSheet aware of the keyboard and expand to accommodate it */}
                <View style={styles.searchContainer}>
                    <BottomSheetTextInput
                        style={styles.searchInput}
                        label="Search..."
                        placeholder={'Search...'}
                        onChangeText={(text) => {setSearchText(text)}}
                    />
                </View>
                {/*  flatlist  */}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
        padding: Spacing.lg,
        borderRadius: BorderRadius.sm,
        elevation: 4,
        shadowColor: '#000',
    },
    title: {
        fontSize: Typography.subtitle,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.lg,
        color: Colors.light.text,
    },
    searchContainer: {
        marginBottom: Spacing.lg,
    },
    searchInput: {
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.light.backgroundTertiary,
        fontSize: Typography.bodyLarge,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    itemContainer: {
        padding: Spacing.md,
        marginVertical: Spacing.sm,
        backgroundColor: Colors.light.backgroundTertiary,
        borderRadius: BorderRadius.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    itemPressed: {
        backgroundColor: Colors.light.border,
    },
    name: {
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.medium,
        color: Colors.light.text,
    },
    listContent: {
        paddingBottom: 50,
    }
})

export default SelectStatusBottomSheet;
