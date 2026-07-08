import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectStatusBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/statuslabels/selectlist"
        selectedValue={props.selectedStatus}
        onSelect={(item) => props.setSelectedStatus({ ...item, value: item.id })}
    />
));

export default SelectStatusBottomSheet;
