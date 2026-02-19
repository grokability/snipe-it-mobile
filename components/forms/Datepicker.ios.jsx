import {View} from 'react-native'
import RNDateTimePicker from "@react-native-community/datetimepicker";
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

    return (
        <View>
            <RNDateTimePicker
                value={date}
                mode={"date"}
                display={"default"}
                locale={"en-US"}
                onChange={(event, selectedDate) => {
                    if (selectedDate) {
                        setDate(selectedDate);
                        onDateChange(event, selectedDate);
                    }}
                }
            />
        </View>
    )
}