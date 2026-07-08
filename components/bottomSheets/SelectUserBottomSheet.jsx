import React, { forwardRef } from 'react';
import SelectListBottomSheet from '@/components/bottomSheets/SelectListBottomSheet';

const SelectUserBottomSheet = forwardRef((props, ref) => (
    <SelectListBottomSheet
        ref={ref}
        title={props.title}
        endpoint="/users/selectlist"
        avatarStyle="circle"
        selectedValue={props.selectedUser}
        onSelect={(item) => props.setSelectedUser({ ...item, avatar: item.image })}
    />
));

export default SelectUserBottomSheet;
