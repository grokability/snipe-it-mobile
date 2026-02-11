import React, {useContext, useMemo, useRef, useState} from 'react';
import {Text, Button, StyleSheet, TextInput, Platform} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {makeRequest} from "@/helpers/axiosConfig";
import {AuthContext} from "@/context/AuthProvider";
import SelectUserBottomSheet from "@/components/bottomSheets/SelectUserBottomSheet";
import SelectStatusBottomSheet from "@/components/bottomSheets/SelectStatusBottomSheet";
import SelectLocationBottomSheet from "@/components/bottomSheets/SelectLocationBottomSheet";
import SelectAssetBottomSheet from "@/components/bottomSheets/SelectAssetBottomSheet";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import {Host, Picker} from '@expo/ui/swift-ui';
import * as Burnt from 'burnt';
import {CheckoutPicker} from "@/components/CheckoutPicker";
import Datepicker from "@/components/Datepicker";
import {useColors} from "@/hooks/useThemeColors";
import {Spacing, Typography, FontWeight, BorderRadius} from "@/constants/sizes";
import {useTranslation} from "react-i18next";

export default function CheckoutScreen() {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const { id } = useLocalSearchParams();
    const { user } = useContext(AuthContext);
    const [error, setError] = useState(null);

    const userBottomSheetRef  = useRef(null);
    const statusBottomSheetRef = useRef(null);
    const locationBottomSheetRef = useRef(null);
    const assetBottomSheetRef = useRef(null);
    const handleOpenUserBottomSheet = () => userBottomSheetRef.current?.present();
    const handleOpenStatusBottomSheet = () => statusBottomSheetRef.current?.present();
    const handleOpenLocationBottomSheet = () => locationBottomSheetRef.current?.present();
    const handleOpenAssetBottomSheet = () => assetBottomSheetRef.current?.present();

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const [assetName, setAssetName] = useState("")

    const [selectedCheckoutTo, setSelectedCheckoutTo] = useState("user");

    const [notes, setNotes] = useState("");

    const [checkoutDate, setCheckoutDate] = useState();
    const [expectedCheckinDate, setExpectedCheckinDate] = useState();

    const handleCheckoutDate = (event, selectedDate) => {
        const currentDate = selectedDate;
        if (currentDate) {
            console.log(currentDate);
            setCheckoutDate(currentDate);
        }
    }

    const handleExpectedCheckinDate = (event, selectedDate) => {
       const currentDate = selectedDate;
       if (currentDate) {
           console.log(currentDate);
           setExpectedCheckinDate(currentDate);
       }
    }


    function checkout() {
        if (!selectedStatus && (!selectedUser || !selectedLocation || !selectedAsset)) {
            Burnt.alert({
                title: t('general.error'),
                preset: "error",
                message: t('mobile.status_and_target_required'),
                duration: 2,
            })
            return;
        }

        console.log('checkout');
        makeRequest({
            url: `/hardware/${id}/checkout`,
            method: 'POST',
            data: {
                name: assetName,
                checkout_to_type: selectedCheckoutTo,
                assigned_user: selectedUser?.id,
                assigned_location: selectedLocation?.id,
                assigned_asset: selectedAsset?.id,
                status_id: selectedStatus.value,
                checkout_at: checkoutDate,
                expected_checkin: expectedCheckinDate,
                note: 'mobile app checkout: ' + notes,
            }
        })
            .then(res => {
                if(res.status === 'error') {
                   setError(res);
                   console.log(res);
                   console.log('validation error');
                   Burnt.alert({
                       title: t('general.error'),
                       preset: "error",
                       message: res.messages?.assigned_asset?.[0] || t('mobile.checkout_failed'),
                       duration: 4,
                   })
                    return;
                }
                Burnt.alert({
                    title: t('general.notification_success'),
                    preset: "heart",
                    duration: 4
                })
                router.replace(`/(tabs)/(assets)/${id}`)
            })
            .catch(err => {
                console.log(err);
            });
    }

    return (
        <SafeAreaProvider style={styles.container}>
            <Text style={styles.headerText}>{t('mobile.checkout_title', { id })}</Text>
            {/* asset name */}
            <Text style={styles.labelText}>{t('mobile.asset_name_display', { name: selectedAsset?.name })}</Text>
            <TextInput placeholder={t('general.asset_name')} onChangeText={setAssetName} style={styles.input}></TextInput>

            {/* status select sheet */}
            <Button title={t('general.select_statuslabel')} onPress={handleOpenStatusBottomSheet} />
            <SelectStatusBottomSheet title={t('general.select_statuslabel')} ref={statusBottomSheetRef} setSelectedStatus={setSelectedStatus}/>
            <Text style={styles.selectedText}>{t('mobile.selected_status', { name: selectedStatus?.name })}</Text>

            <Text style={styles.labelText}>{t('mobile.checkout_to')}</Text>

            <CheckoutPicker selectedCheckoutTo={selectedCheckoutTo} setSelectedCheckoutTo={setSelectedCheckoutTo} availableOptions={['User', 'Location', 'Asset']} />

                {/*<Text>{[...checkoutToOptions, 'unset'][selectedIndex ?? checkoutToOptions.length]}</Text>*/}

            {/* user select sheet */}
            {selectedCheckoutTo === 'user' && (
                <>
                    <Button title={t('general.select_user')} onPress={handleOpenUserBottomSheet} />
                    <SelectUserBottomSheet title={t('general.select_user')} ref={userBottomSheetRef} setSelectedUser={setSelectedUser}/>
                    <Text style={styles.selectedText}>{t('mobile.selected_user', { name: selectedUser?.name })}</Text>
                </>
            )}

            {/* location select sheet */}
            {selectedCheckoutTo === 'location' && (
            <>
                <Button title={t('general.select_location')} onPress={handleOpenLocationBottomSheet} />
                <SelectLocationBottomSheet title={t('general.select_location')} ref={locationBottomSheetRef} setSelectedLocation={setSelectedLocation}/>
                <Text style={styles.selectedText}>{t('mobile.selected_location', { name: selectedLocation?.name })}</Text>
            </>
            )}

            {/* asset select sheet */}
            {selectedCheckoutTo === 'asset' && (
            <>
                <Button title={t('general.select_asset')} onPress={handleOpenAssetBottomSheet} />
                <SelectAssetBottomSheet title={t('general.select_asset')} ref={assetBottomSheetRef} setSelectedAsset={setSelectedAsset}/>
                <Text style={styles.selectedText}>{t('mobile.selected_asset', { name: selectedAsset?.name })}</Text>
            </>
            )}

            {/* checkout/in dates */}
            <Text style={styles.headerText}>{t('general.checkout_date')}</Text>
            <Datepicker onDateChange={handleCheckoutDate} />


            <Text style={styles.headerText}>{t('general.expected_checkin')}</Text>
            <Datepicker onDateChange={handleExpectedCheckinDate}/>

            {/*/ notes */}
            <Text style={styles.headerText}>{t('general.notes')}</Text>
            <TextInput placeholder={t('general.notes')} onChange={setNotes} value={notes} style={styles.input} />
            {/* submit button */}
            <Button title={t('general.checkout')} onPress={() => checkout()} />


        </SafeAreaProvider>
    )
}
const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    headerText: {
        fontSize: Typography.title,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.md,
        color: colors.text,
    },
    labelText: {
        fontSize: Typography.body,
        color: colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    selectedText: {
        fontSize: Typography.body,
        color: colors.text,
        marginVertical: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        width: '80%',
        color: colors.text,
    },
})
