import React, {useCallback, useContext, useRef, useState} from 'react';
import {Text, Button, StyleSheet} from "react-native";
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import DropDownPicker from 'react-native-dropdown-picker';
import SelectUserBottomSheet from "@/components/bottomSheets/SelectUserBottomSheet";
import SelectStatusBottomSheet from "@/components/bottomSheets/SelectStatusBottomSheet";

export default function CheckoutScreen() {
    // standard screen states
    const { id } = useLocalSearchParams();
    const { user } = useContext(AuthContext);
    const [error, setError] = useState(null);
    // dropdown
    const [items, setItems] = useState([]);

    // bottomsheet
    const userBottomSheetRef  = useRef(null);
    const statusBottomSheetRef = useRef(null);
    const handleOpenUserBottomSheet = () => userBottomSheetRef.current?.present();
    const handleOpenStatusBottomSheet = () => statusBottomSheetRef.current?.present();

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);

    // function getStatusLabels() {
    //     makeRequest({
    //         url: `/statuslabels`,
    //         method: 'GET',
    //         headers: { 'Authorization': `Bearer ${user.token}` }
    //     }).then(res => {
    //         console.log(res);
    //         setStatuses(
    //             res.rows.map(status => {
    //                 return {
    //                     label: status.name,
    //                     value: status.id,
    //                 }
    //             })
    //         )
    //         console.log(statuses[0]);
    //     })
    // }

    function checkout() {
        console.log('checkout');
        makeRequest({
            url: `/hardware/${id}/checkout`,
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.token}` },
            data: {
                checkout_to_type: 'user',
                assigned_user: selectedUser.value,
                status_id: selectedStatus.value,
                note: 'mobile app checkout'
            }
        }).then(res => {
            if(res.status === 'error') {
               setError(res);
               console.error(error);
                console.error('validation error');
            }
            console.log(res);
            router.replace(`/(tabs)/(assets)/${id}`)
        }).catch(err => {
            console.log(err);
        })
        console.log('checkout');
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <Text>Checkout Asset {id}</Text>

            <Button title="Select User" onPress={handleOpenUserBottomSheet} />
            <SelectUserBottomSheet title="Select User" ref={userBottomSheetRef} setSelectedUser={setSelectedUser}/>
            <Text>Selected User: {selectedUser?.name}</Text>

            {/*<DropDownPicker
                placeholder="Select Status"
                setOpen={setStatusDropdown}
                open={statusDropdown}
                onOpen={onStatusDropdownOpen}
                setValue={setStatusValue}
                value={statusValue}
                items={statuses}
                zIndex={1000}
                zIndexInverse={2000}
             */}   />
            <Button title="Select Status" onPress={handleOpenStatusBottomSheet} />
            <SelectStatusBottomSheet title="Select Status" ref={statusBottomSheetRef} setSelectedStatus={setSelectedStatus}/>
            <Text>Selected Status: {selectedStatus?.name}</Text>
            <Button title="Checkout" onPress={() => checkout()} />


        </SafeAreaProvider>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})