import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectCategoryBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint={`/categories/${props.categoryType}/selectlist`}
        selectedValue={props.selectedCategory}
        onSelect={props.setSelectedCategory}
    />
));

export default SelectCategoryBottomSheet;
