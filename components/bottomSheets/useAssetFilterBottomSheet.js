import { useEffect, useRef, useState } from "react";

const EMPTY_FILTERS = {
    status: null,
    category: null,
    manufacturer: null,
    supplier: null,
    location: null,
    company: null,
    model: null,
};

// Shared filter-state logic behind AssetFilterBottomSheet's platform-specific chrome.
export function useAssetFilterBottomSheet({ filters, onApply, bottomSheetRef }) {
    const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
    // Keep a ref in sync so onDismiss always reads the latest value without stale closure issues
    const pendingFiltersRef = useRef(EMPTY_FILTERS);

    const updateFilter = (key, value) => {
        setTempFilters((prev) => {
            const next = { ...prev, [key]: value };
            pendingFiltersRef.current = next;
            return next;
        });
    };

    // Sync temp state from props when filters change (e.g. sheet re-opens with existing filters)
    useEffect(() => {
        const next = filters ?? EMPTY_FILTERS;
        setTempFilters(next);
        pendingFiltersRef.current = next;
    }, [filters]);

    const handleClearAll = () => {
        const empty = { ...EMPTY_FILTERS };
        setTempFilters(empty);
        pendingFiltersRef.current = empty;
        onApply(empty);
        bottomSheetRef.current?.close();
    };

    const handleApply = () => {
        onApply(pendingFiltersRef.current);
        bottomSheetRef.current?.close();
    };

    return { tempFilters, updateFilter, handleClearAll, handleApply };
}
