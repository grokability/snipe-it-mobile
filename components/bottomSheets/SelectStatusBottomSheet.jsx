import {Text, View, StyleSheet, Button, Pressable} from "react-native";
import {BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, useBottomSheet} from "@gorhom/bottom-sheet";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import React, {useMemo, useState, forwardRef, useContext, useEffect} from "react";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";

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
        >
            <View style={{padding: 10, marginVertical: 8, backgroundColor: '#eee', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                <Text style={styles.name}>{item.name}</Text>
            </View>
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
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        elevation: 4,
        shadowColor: '#000',
    }
})
export default SelectStatusBottomSheet;