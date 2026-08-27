export const assetKeys = {
    all: ['assets'],
    lists: () => [...assetKeys.all, 'list'],
    list: (params) => [...assetKeys.lists(), params],
    details: () => [...assetKeys.all, 'detail'],
    detail: (id) => [...assetKeys.details(), id],
};

export const customFieldKeys = {
    all: ['customFields'],
};

export const accessoryKeys = {
    all: ['accessories'],
    lists: () => [...accessoryKeys.all, 'list'],
    list: (params) => [...accessoryKeys.lists(), params],
    details: () => [...accessoryKeys.all, 'detail'],
    detail: (id) => [...accessoryKeys.details(), id],
    checkedOut: (id) => [...accessoryKeys.detail(id), 'checkedOut'],
};
