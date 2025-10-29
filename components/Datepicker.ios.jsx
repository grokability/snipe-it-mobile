import {Text, View} from 'react-native'
import RNDateTimePicker from "@react-native-community/datetimepicker";
import React, {useState} from "react";

export default function Datepicker({onDateChange}) {
    const [date, setDate] = useState(new Date());

    return (
        <View>
            <Text>iOS Datepicker</Text>
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