import { useState, useEffect, useMemo } from "react";
import { debounce } from "lodash";

export function useDebouncedSearch<T>(
  searchFunction: (query: string) => void,
  delay: number = 300
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Create debounced function
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedQuery(query);
        searchFunction(query);
      }, delay),
    [searchFunction, delay]
  );

  // Update search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);

    // Cleanup on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  return {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
    isSearching: searchQuery !== debouncedQuery,
  };
}

// Hook for debouncing any value
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
