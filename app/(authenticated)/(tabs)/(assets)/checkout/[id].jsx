import React, {useCallback, useContext, useEffect, useRef, useState, useMemo} from 'react';
import {Text, Button, StyleSheet} from "react-native";
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import DropDownPicker from 'react-native-dropdown-picker';
import SelectUserBottomSheet from "@/components/bottomSheets/SelectUserBottomSheet";

export default function CheckoutScreen() {
    // standard screen states
    const { id } = useLocalSearchParams();
    const { user } = useContext(AuthContext);
    const [error, setError] = useState(null);
    // dropdown
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState(null);
    const [items, setItems] = useState([]);

    // bottomsheet
    // const snapPoints = useMemo(() => ['50%', '75%', '90%'], []);
    const bottomSheetRef = useRef(null);
    const handleOpenBottomSheet = () => bottomSheetRef.current?.present();

    const [selectedUser, setSelectedUser] = useState(null);

    // initial status states
    const [statuses, setStatuses] = useState();

    // makes sure dropdowns close when others open
    const [userDropdown, setUserDropdown] = useState(false)
    const [statusDropdown, setStatusDropdown] = useState(false)

    // the selected dropdown items
    const [statusValue, setStatusValue] = useState(null);

    const onUserDropdownOpen = useCallback(() => {
        setStatusDropdown(false);
    })

    const onStatusDropdownOpen = useCallback(() => {
        setUserDropdown(false);
    })

    useFocusEffect(useCallback( () => {
        getInitialUsers();
        getStatusLabels();
    }, []))

    function getInitialUsers() {
        makeRequest({
            url: `/users?sort=first_name&order=asc`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(res => {
            setItems(
                res.rows.map(user => {
                    return {
                        label: user.name,
                        value: user.id,
                    }
                }))
        }).catch(err => {
            console.log(err);
        })
    }

    function getStatusLabels() {
        makeRequest({
            url: `/statuslabels`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(res => {
            console.log(res);
            setStatuses(
                res.rows.map(status => {
                    return {
                        label: status.name,
                        value: status.id,
                    }
                })
            )
            console.log(statuses[0]);
        })
    }

    function checkout() {
        console.log('checkout');
        makeRequest({
            url: `/hardware/${id}/checkout`,
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.token}` },
            data: {
                checkout_to_type: 'user',
                assigned_user: selectedUser.value,
                status_id: statusValue.value,
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

            <Button title="Select User" onPress={handleOpenBottomSheet} />
            <SelectUserBottomSheet title="Select User" ref={bottomSheetRef} setSelectedUser={setSelectedUser}/>
            <Text>Selected User: {selectedUser?.name}</Text>

            <DropDownPicker
                placeholder="Select Status"
                setOpen={setStatusDropdown}
                open={statusDropdown}
                onOpen={onStatusDropdownOpen}
                setValue={setStatusValue}
                value={statusValue}
                items={statuses}
                zIndex={1000}
                zIndexInverse={2000}
                />
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