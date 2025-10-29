import {Button, Text, View} from "react-native";
import RNDateTimePicker, {DateTimePickerAndroid} from "@react-native-community/datetimepicker";
import React, {useState} from "react";

export default function Datepicker({onDateChange}) {
    const [date, setDate] = useState(new Date());


    const showMode = (currentMode) => {
        DateTimePickerAndroid.open({
            value: date,
            onChange: (event, selectedDate) => {
                if (selectedDate) {
                    setDate(selectedDate);
                    onDateChange(event, selectedDate);
                }
            },
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
