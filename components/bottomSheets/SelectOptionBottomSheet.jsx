import { BottomSheetModal } from "@expo/ui/community/bottom-sheet";
import { Platform } from "react-native";
import React, { forwardRef, useMemo, useState } from "react";
import { useColors } from "@/hooks/useThemeColors";
import { useTranslation } from "react-i18next";
import { CloseBtn, SNAP_POINTS } from "@/components/bottomSheets/SelectListBottomSheet";
import SelectListContent from "@/components/bottomSheets/SelectListContent";

const SelectOptionBottomSheet = forwardRef((props, ref) => {
    const {
        title,
        options,
        selectedValue,
        onSelect,
    } = props;

    const colors = useColors();
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState('');

    const selectedOption = options.find((option) => option.value === selectedValue);
    const pinnedItem = (searchText || !selectedOption)
        ? null
        : { id: selectedOption.value, text: selectedOption.label };

    const displayItems = useMemo(() => {
        const search = searchText.trim().toLowerCase();
        const matchingOptions = options
            .filter((option) => option.value !== pinnedItem?.id)
            .filter((option) => option.label.toLowerCase().includes(search))
            .map((option) => ({ id: option.value, text: option.label }));

        if (search || !selectedOption) {
            return matchingOptions;
        }

        return [{ id: '', text: t('general.clear_selection') }, ...matchingOptions];
    }, [options, searchText, pinnedItem?.id, selectedOption, t]);

    const selectItem = (item) => {
        onSelect(item.id);
        ref.current?.close();
    };

    const backgroundStyle = Platform.OS === 'ios' ? undefined : { backgroundColor: colors.background };

    return (
        <BottomSheetModal
            index={0}
            ref={ref}
            snapPoints={SNAP_POINTS}
            backgroundStyle={backgroundStyle}
            enablePanDownToClose
            onDismiss={() => setSearchText('')}
        >
            <SelectListContent
                title={title}
                selectedValue={selectedOption ? { id: selectedOption.value } : null}
                displayItems={displayItems}
                isLoading={false}
                isLoadingMore={false}
                pinnedItem={pinnedItem}
                loadMore={() => {}}
                handleSearchChange={(text) => setSearchText(text)}
                selectItem={(item) => selectItem(item)}
                headerAction={<CloseBtn />}
            />
        </BottomSheetModal>
    );
});

export default SelectOptionBottomSheet;
