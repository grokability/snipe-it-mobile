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
