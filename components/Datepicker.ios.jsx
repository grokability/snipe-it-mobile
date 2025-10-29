import {Text, View} from 'react-native'
import RNDateTimePicker from "@react-native-community/datetimepicker";
import React from "react";

export default function Datepicker() {
    const onChange = (event, selectedDate) => {
        console.log(selectedDate);
    }

    return (
        <View>
            <Text>iOS Datepicker</Text>
            <RNDateTimePicker
                value={new Date()}
                mode={"date"}
                display={"default"}
                locale={"en-US"}
                onChange={onChange}
            />
        </View>
    )
}