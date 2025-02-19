import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Text, Button, StyleSheet} from "react-native";
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "../../../../helpers/axiosConfig";
import {AuthContext} from "../../../../context/AuthProvider";
import DropDownPicker from 'react-native-dropdown-picker';
import {debounce} from "lodash";

export default function CheckoutScreen() {
    // standard screen states
    const { id } = useLocalSearchParams();
    const { user } = useContext(AuthContext);
    const [error, setError] = useState(null);
    // dropdown
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState(null);
    const [items, setItems] = useState([]);

    // initial status states
    const [statuses, setStatuses] = useState();

    // makes sure dropdowns close when others open
    const [userDropdown, setUserDropdown] = useState(false)
    const [statusDropdown, setStatusDropdown] = useState(false)

    // the selected dropdown items
    const [selectedUser, setSelectedUser] = useState(null);
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
            <DropDownPicker
                placeholder="Select User"
                open={userDropdown}
                onOpen={onUserDropdownOpen}
                searchable={true}
                onChangeSearchText={(text) => {
                    // Show the loading animation
                    setLoading(true);

                    // Get items from API
                    makeRequest({
                        url: `/users?sort=first_name&order=asc&search=${text}`,
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    })
                        .then((res) => {
                            setItems(
                                res.rows.map(user => {
                                    return {
                                        label: user.name,
                                        value: user.id,
                                    }
                                }))
                        })
                        .catch((err) => {
                           console.error(err);
                        })
                        .finally(() => {
                            // Hide the loading animation
                            setLoading(false);
                        });
                }}
                onSelectItem={(item) => {
                    setSelectedUser(item);
                }}
                disableLocalSearch={true}
                loading={loading}
                value={value}
                items={items}
                setValue={setValue}
                setItems={setItems}
                setOpen={setUserDropdown}
                style={{padding: 10}}
                zIndex={2000}
                zIndexInverse={1000}
            />
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