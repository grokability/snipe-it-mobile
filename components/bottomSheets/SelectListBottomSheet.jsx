import {
    BottomSheetModal,
    useBottomSheet
} from "@expo/ui/community/bottom-sheet";
import { Button, Platform } from "react-native";
import React, { forwardRef, useRef } from "react";
import { useColors } from "@/hooks/useThemeColors";
import { useTranslation } from "react-i18next";
import { useSelectListBottomSheet } from "@/components/bottomSheets/useSelectListBottomSheet";
import SelectListContent from "@/components/bottomSheets/SelectListContent";

const SNAP_POINTS = ['60%', '90%'];

const CloseBtn = () => {
    const { close } = useBottomSheet();
    const { t } = useTranslation();
    return <Button title={t('general.close')} onPress={() => close()} />;
};

// Shared implementation behind all Select*BottomSheet pickers (status, model, category, etc.)
// so fetch/pagination/search/styling stays consistent across the whole family.
const SelectListBottomSheet = forwardRef((props, ref) => {
    const {
        title,
        endpoint,
        onSelect,
        selectedValue,
        avatarStyle = 'square',
    } = props;

    const colors = useColors();
    const { t } = useTranslation();

    const selectListProps = useSelectListBottomSheet({
        endpoint,
        selectedValue,
        onSelect,
        onSelected: () => ref.current?.close(),
    });
    const { fetchInitial, handleReset } = selectListProps;

    // @expo/ui's BottomSheet only reports the current index (no fromIndex/toIndex pair
    // like gorhom's onAnimate), so track the previous index ourselves to detect "just opened".
    const prevIndexRef = useRef(-1);
    const handleIndexChange = (index) => {
        if (prevIndexRef.current < 0 && index >= 0) {
            fetchInitial();
        }
        prevIndexRef.current = index;
    };

    const handleDismiss = () => {
        handleReset();
        prevIndexRef.current = -1;
    };

    const backgroundStyle = Platform.OS === 'ios' ? undefined : { backgroundColor: colors.background };

    return (
        <BottomSheetModal
            index={0}
            ref={ref}
            snapPoints={SNAP_POINTS}
            backgroundStyle={backgroundStyle}
            enablePanDownToClose
            onChange={handleIndexChange}
            onDismiss={handleDismiss}
        >
            <SelectListContent
                {...selectListProps}
                title={title}
                avatarStyle={avatarStyle}
                selectedValue={selectedValue}
                headerAction={<CloseBtn />}
            />
        </BottomSheetModal>
    );
});

export default SelectListBottomSheet;
