import {BottomSheetModal, BottomSheetTextInput, BottomSheetView, useBottomSheet} from "@gorhom/bottom-sheet";
import { Text, Button } from "react-native";
import React, { forwardRef, useMemo } from "react";
import BottomSheet from "@gorhom/bottom-sheet";
// export type Ref = BottomSheet;

const CloseBtn = () => {
    const { close } = useBottomSheet();

    return <Button title="Close" onPress={() => close()} />;
};

const SelectUserBottomSheet = forwardRef((props, ref) => {
    const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);


    return (
        <BottomSheetModal
            index={1}
            ref={ref}
            snapPoints={snapPoints}
        >
            <BottomSheetView>
                <Text>{props.title}</Text>
                {/* we use BottomSheetTextInput to make the BottomSheet aware of the keyboard and expand to accommodate it */}
                <BottomSheetTextInput
                    label="Search..."
                    placeholder={'Search...'}
                    onChangeText={(text) => {}}
                />
                <CloseBtn />
            </BottomSheetView>
        </BottomSheetModal>
    )
})
export default SelectUserBottomSheet;