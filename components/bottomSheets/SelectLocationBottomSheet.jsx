import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectLocationBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/locations/selectlist"
        selectedValue={props.selectedLocation}
        onSelect={props.setSelectedLocation}
    />
));

export default SelectLocationBottomSheet;
