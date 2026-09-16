import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectSupplierBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/suppliers/selectlist"
        selectedValue={props.selectedSupplier}
        onSelect={props.setSelectedSupplier}
    />
));

export default SelectSupplierBottomSheet;
