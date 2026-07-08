import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectManufacturerBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/manufacturers/selectlist"
        selectedValue={props.selectedManufacturer}
        onSelect={props.setSelectedManufacturer}
    />
));

export default SelectManufacturerBottomSheet;
