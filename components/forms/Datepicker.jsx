import {Button, Text, View} from "react-native";
import RNDateTimePicker, {DateTimePickerAndroid} from "@react-native-community/datetimepicker";
import React, {useState} from "react";

function parseLocalDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    // Parse "YYYY-MM-DD" as local date to avoid timezone shift
    const parts = String(dateInput).split('-');
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateInput);
}

export default function Datepicker({onDateChange, initialDate}) {
    const [date, setDate] = useState(parseLocalDate(initialDate));


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
