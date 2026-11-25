import { BottomSheetModal } from "@expo/ui/community/bottom-sheet";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import React, { forwardRef, useMemo, useState } from "react";
import { useColors } from "@/hooks/useThemeColors";
import { useTranslation } from "react-i18next";
import { BorderRadius, FontWeight, Spacing, Typography } from "@/constants/sizes";
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
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState('');

    const selectedOption = options.find((option) => option.value === selectedValue);
    const pinnedItem = (searchText || !selectedOption)
        ? null
        : { id: selectedOption.value, text: selectedOption.label };

    const displayItems = useMemo(() => {
        const search = searchText.trim().toLowerCase();
        return options
            .filter((option) => option.value !== pinnedItem?.id)
            .filter((option) => option.label.toLowerCase().includes(search))
            .map((option) => ({ id: option.value, text: option.label }));
    }, [options, searchText, pinnedItem?.id]);

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
                footer={selectedOption ? (
                    <Pressable
                        onPress={() => selectItem({ id: '' })}
                        style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
                    >
                        <Text style={styles.clearButtonText}>{t('general.clear_selection')}</Text>
                    </Pressable>
                ) : null}
            />
        </BottomSheetModal>
    );
});

const createStyles = (colors) => StyleSheet.create({
    clearButton: {
        backgroundColor: colors.backgroundTertiary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    clearButtonPressed: {
        opacity: 0.8,
    },
    clearButtonText: {
        color: colors.text,
        fontSize: Typography.bodyLarge,
        fontWeight: FontWeight.semibold,
    },
});

export default SelectOptionBottomSheet;
