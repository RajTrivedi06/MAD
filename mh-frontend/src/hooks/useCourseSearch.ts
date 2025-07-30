import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { searchCourses, type CourseFilters } from "@/lib/supabase/courses";
import type { CourseWithPopularity } from "@/types/course.types";

interface UseCourseSearchResult {
  courses: CourseWithPopularity[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: CourseFilters;
  updateFilter: (
    key: keyof CourseFilters,
    value: string | string[] | number | boolean | null
  ) => void;
  clearFilters: () => void;
  refetch: () => void;
}

const DEFAULT_FILTERS: CourseFilters = {
  searchQuery: "",
  college: [],
  credits: [],
  level: [],
  requirement: [],
  page: 0,
  pageSize: 20,
  sortBy: "course_code",
  sortOrder: "asc",
};

export function useCourseSearch(): UseCourseSearchResult {
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_FILTERS);

  // Create a stable query key for React Query
  const queryKey = useMemo(() => ["courses", filters], [filters]);

  // Fetch courses with React Query
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => searchCourses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaced cacheTime)
    enabled: true, // Always enabled
  });

  // Debounced filter update for search
  const debouncedUpdateFilter = useMemo(
    () =>
      debounce(
        (
          key: keyof CourseFilters,
          value: string | string[] | number | boolean | null
        ) => {
          setFilters((prev: CourseFilters) => ({
            ...prev,
            [key]: value,
            // Reset page when filters change (except for page itself)
            page: key === "page" ? (value as number) : 0,
          }));
        },
        300
      ),
    []
  );

  // Update filter function
  const updateFilter = useCallback(
    (
      key: keyof CourseFilters,
      value: string | string[] | number | boolean | null
    ) => {
      if (key === "searchQuery") {
        debouncedUpdateFilter(key, value);
      } else {
        setFilters((prev: CourseFilters) => ({
          ...prev,
          [key]: value,
          page: key === "page" ? (value as number) : 0,
        }));
      }
    },
    [debouncedUpdateFilter]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    courses: (data as any)?.courses || [],
    loading,
    error: error as Error | null,
    totalCount: (data as any)?.totalCount || 0,
    currentPage: (data as any)?.page || 0,
    totalPages: (data as any)?.totalPages || 0,
    filters,
    updateFilter,
    clearFilters,
    refetch: () => refetch(),
  };
}
