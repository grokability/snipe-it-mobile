import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectModelBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/models/selectlist"
        selectedValue={props.selectedModel}
        onSelect={props.setSelectedModel}
    />
));

export default SelectModelBottomSheet;
