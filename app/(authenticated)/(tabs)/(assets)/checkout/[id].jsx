import React, {useContext, useRef, useState} from 'react';
import {Text, Button, StyleSheet, TextInput} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import SelectUserBottomSheet from "@/components/bottomSheets/SelectUserBottomSheet";
import SelectStatusBottomSheet from "@/components/bottomSheets/SelectStatusBottomSheet";
import SelectLocationBottomSheet from "@/components/bottomSheets/SelectLocationBottomSheet";
import SelectAssetBottomSheet from "@/components/bottomSheets/SelectAssetBottomSheet";
import RNDateTimePicker from "@react-native-community/datetimepicker";

export default function CheckoutScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useContext(AuthContext);
    const [error, setError] = useState(null);

    const userBottomSheetRef  = useRef(null);
    const statusBottomSheetRef = useRef(null);
    const locationBottomSheetRef = useRef(null);
    const assetBottomSheetRef = useRef(null);
    const handleOpenUserBottomSheet = () => userBottomSheetRef.current?.present();
    const handleOpenStatusBottomSheet = () => statusBottomSheetRef.current?.present();
    const handleOpenLocationBottomSheet = () => {locationBottomSheetRef.current?.present()};
    const handleOpenAssetBottomSheet = () => {assetBottomSheetRef.current?.present()};

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const [assetName, setAssetName] = useState("")

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
            <Text style={styles.headerText}>Checkout Asset #{id}</Text>
            {/* asset name */}
            <Text style={styles.headerText}>Asset Name: {selectedAsset?.name}</Text>
            <TextInput placeholder="Asset Name" onChangeText={setAssetName}></TextInput>

            {/* status select sheet */}
            <Button title="Select Status" onPress={handleOpenStatusBottomSheet} />
            <SelectStatusBottomSheet title="Select Status" ref={statusBottomSheetRef} setSelectedStatus={setSelectedStatus}/>
            <Text>Selected Status: {selectedStatus?.name}</Text>

            <Text>Checkout to: </Text>

            {/* user select sheet */}
            <Button title="Select User" onPress={handleOpenUserBottomSheet} />
            <SelectUserBottomSheet title="Select User" ref={userBottomSheetRef} setSelectedUser={setSelectedUser}/>
            <Text>Selected User: {selectedUser?.name}</Text>

            {/* location select sheet */}
            <Button title="Select Location" onPress={handleOpenLocationBottomSheet} />
            <SelectLocationBottomSheet title="Select Location" ref={locationBottomSheetRef} setSelectedLocation={setSelectedLocation}/>
            <Text>Selected Location: {selectedLocation?.name}</Text>

            {/* asset select sheet */}
            <Button title="Select Asset" onPress={handleOpenAssetBottomSheet} />
            <SelectAssetBottomSheet title="Select Asset" ref={assetBottomSheetRef} setSelectedAsset={setSelectedAsset}/>
            <Text>Selected Asset: {selectedAsset?.name}</Text>

            {/* checkout/in dates */}
            <Text style={styles.headerText}>Checkout Date</Text>
            <RNDateTimePicker value={new Date()} />

            <Text style={styles.headerText}>Expected Checkin Date</Text>
            <RNDateTimePicker value={new Date()} />

            {/*/ notes */}
            <Text style={styles.headerText}>Notes</Text>
            <TextInput placeholder="Notes" />
            {/* submit button */}
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
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    }
})