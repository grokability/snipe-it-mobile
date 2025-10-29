import {Button, Text, View} from "react-native";
import RNDateTimePicker, {DateTimePickerAndroid} from "@react-native-community/datetimepicker";
import React, {useState} from "react";

export default function Datepicker() {
    const [date, setDate] = useState(new Date());

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate;
        if (currentDate) {
            console.log(currentDate);
            setDate(currentDate);
        }
    };

    const showMode = (currentMode) => {
        DateTimePickerAndroid.open({
            value: date,
            onChange,
            mode: currentMode,
            is24Hour: true,
        });
    };

    const showDatepicker = () => {
        showMode('date');
    };

    return (
        <View>
            <Button onPress={showDatepicker} title={date.toDateString()} />
        </View>
    )
}
