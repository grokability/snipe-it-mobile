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
import {COLORS} from "@/constants/colors";
import {GestureHandlerRootView} from "react-native-gesture-handler";
// export type Ref = BottomSheet;

const CloseBtn = () => {
    const { close } = useBottomSheet();

    return <Button title="Close" onPress={() => close()} />;
};

const SelectLocationBottomSheet = forwardRef((props, ref) => {
    const { user } = useContext(AuthContext);
    const [locations, setLocations] = useState([])
    const [searchText, setSearchText] = useState('')
    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);

    useEffect(() => {
        fetchLocations();
    }, [searchText])

    const fetchLocations = () => {
        makeRequest({
            url: `/locations?sort=first_name&order=asc&search=${searchText}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
            .then((res) => {
                setLocations(res.rows)
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                // Hide the loading animation
                // setLoading(false);
            });
    }

    const selectLocation = (location) => {
        props.setSelectedLocation(location)
        ref.current.close()
    }

    const Item = ({item}) => {
        return (
            <Pressable
                onPress={() => selectLocation(item)}
                style={({pressed}) => [
                    styles.itemContainer,
                    pressed && styles.itemPressed
                ]}
            >
                <View style={styles.locationInfoContainer}>
                    <Text style={styles.locationName}>{item.name}</Text>
                </View>
            </Pressable>
        )
    }


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
                    data={locations}
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
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: COLORS.light.text,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F1F3F5',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E4E7EB',
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E7EB',
    },
    itemPressed: {
        backgroundColor: '#F1F3F5',
    },
    imageContainer: {
        marginRight: 12,
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#687076',
    },
    locationInfoContainer: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.light.text,
    },
    listContent: {
        paddingBottom: 20,
    },
});

export default SelectLocationBottomSheet;