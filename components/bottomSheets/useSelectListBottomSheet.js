import { useMemo, useRef, useState } from "react";
import { makeRequest } from "@/helpers/axiosConfig";
import { PERMISSIONS } from "@/permissions/PermissionKeys";
import debounce from 'lodash/debounce';

// Shared fetch/search/pagination/pinned-item logic behind SelectListContent, reused both by
// SelectListBottomSheet (its own modal) and AssetFilterBottomSheet (embedded drill-down content,
// since a second native modal can't be stacked on top of the first). `onSelected` lets each
// caller decide what "done picking" means: close the modal, or return to the filter menu.
export function useSelectListBottomSheet({ endpoint, selectedValue, onSelect, onSelected }) {
    const [searchText, setSearchText] = useState('');
    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const pageRef = useRef(1);

    const fetchItems = (pageNum, searchQuery = searchText) => {
        if (pageNum === 1) setIsLoading(true);
        makeRequest({
            url: `${endpoint}?search=${searchQuery}&page=${pageNum}`,
            method: 'GET',
            permissionKey: PERMISSIONS.VIEW_SELECTLISTS,
            silent: true,
        })
            .then((res) => {
                const newItems = res?.results ?? [];
                setItems(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
                setHasMore(res?.pagination?.more ?? false);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    };

    const loadMore = () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        pageRef.current += 1;
        fetchItems(pageRef.current);
    };

    // Called by the caller whenever the picker becomes visible (modal opened, or drill-down
    // content mounted) to refetch page 1 with the current search text.
    const fetchInitial = () => {
        pageRef.current = 1;
        fetchItems(1, searchText);
    };

    // Called by the caller whenever the picker is hidden, to clear stale state for next time.
    const handleReset = () => {
        setSearchText('');
        setItems([]);
    };

    const debouncedFetch = useRef(debounce((query) => {
        pageRef.current = 1;
        fetchItems(1, query);
    }, 300)).current;

    const handleSearchChange = (text) => {
        setSearchText(text);
        debouncedFetch(text);
    };

    const selectItem = (item) => {
        onSelect({ ...item, name: item.text });
        onSelected?.();
    };

    const pinnedItem = (searchText || selectedValue?.id == null)
        ? null
        : { id: selectedValue.id, text: selectedValue.name, image: selectedValue.image };

    const displayItems = useMemo(() => {
        if (!pinnedItem) return items;
        return items.filter(item => item.id !== pinnedItem.id);
    }, [items, pinnedItem?.id]);

    return {
        searchText,
        displayItems,
        hasMore,
        isLoading,
        isLoadingMore,
        pinnedItem,
        loadMore,
        fetchInitial,
        handleReset,
        handleSearchChange,
        selectItem,
    };
}
