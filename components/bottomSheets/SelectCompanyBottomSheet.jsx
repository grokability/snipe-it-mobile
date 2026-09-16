import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectCompanyBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/companies/selectlist"
        selectedValue={props.selectedCompany}
        onSelect={props.setSelectedCompany}
    />
));

export default SelectCompanyBottomSheet;
