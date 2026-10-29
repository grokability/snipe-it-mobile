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

export const consumableKeys = {
    all: ['consumables'],
    lists: () => [...consumableKeys.all, 'list'],
    list: (params) => [...consumableKeys.lists(), params],
    details: () => [...consumableKeys.all, 'detail'],
    detail: (id) => [...consumableKeys.details(), id],
};

export const licenseKeys = {
    all: ['licenses'],
    lists: () => [...licenseKeys.all, 'list'],
    list: (params) => [...licenseKeys.lists(), params],
};

export const componentKeys = {
    all: ['components'],
    lists: () => [...componentKeys.all, 'list'],
    list: (params) => [...componentKeys.lists(), params],
};

export const userKeys = {
    all: ['users'],
    lists: () => [...userKeys.all, 'list'],
    list: (params) => [...userKeys.lists(), params],
    details: () => [...userKeys.all, 'detail'],
    detail: (id) => [...userKeys.details(), id],
};

// What a scanned code resolves to. The symbology is part of the key because a 1D barcode and a
// 2D code holding the same text are looked up differently.
export const scanKeys = {
    all: ['scans'],
    resolution: (symbology, data) => [...scanKeys.all, 'resolution', symbology, data],
};

// /reports/activity — the Snipe-IT action log
export const actionLogKeys = {
    all: ['actionLogs'],
    lists: () => [...actionLogKeys.all, 'list'],
    list: (params) => [...actionLogKeys.lists(), params],
    recent: () => [...actionLogKeys.all, 'recent'],
};
