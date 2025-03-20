import {
    BottomSheetFlatList,
    BottomSheetModal,
    BottomSheetTextInput,
    BottomSheetView,
    useBottomSheet
} from "@gorhom/bottom-sheet";
import {Text, Button, Pressable} from "react-native";
import React, {forwardRef, useContext, useEffect, useMemo, useState, useImperativeHandle} from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
// export type Ref = BottomSheet;

const CloseBtn = () => {
    const { close } = useBottomSheet();

    return <Button title="Close" onPress={() => close()} />;
};

const SelectUserBottomSheet = forwardRef((props, ref) => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([])
    const [searchText, setSearchText] = useState('')
    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);

    useEffect(() => {
        fetchUsers();
    }, [searchText])

    const fetchUsers = () => {
        makeRequest({
            url: `/users?sort=first_name&order=asc&search=${searchText}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
            .then((res) => {
                setUsers(res.rows)
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                // Hide the loading animation
                // setLoading(false);
            });
    }

    const Item = ({item}) => {
        return (
            <Pressable onPress={() => props.setSelectedUser(item)}>
                <Text style={{padding: '10'}}>{item.name}</Text>
            </Pressable>
        )
    }


    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
        >
            <BottomSheetView>
                <Text style={{padding: '10'}}>{props.title}</Text>
                {/* we use BottomSheetTextInput to make the BottomSheet aware of the keyboard and expand to accommodate it */}
                <BottomSheetTextInput
                    style={{padding: '10'}}
                    label="Search..."
                    placeholder={'Search...'}
                    onChangeText={(text) => {setSearchText(text)}}
                />
                <CloseBtn />
                {/*  flatlist  */}
                <BottomSheetFlatList data={users} renderItem={({item}) => <Item item={item} />} keyExtractor={item => item.id} />
            </BottomSheetView>
        </BottomSheetModal>
    )
})
export default SelectUserBottomSheet;