import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectAssetBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/hardware/selectlist"
        selectedValue={props.selectedAsset}
        onSelect={props.setSelectedAsset}
    />
));

export default SelectAssetBottomSheet;
