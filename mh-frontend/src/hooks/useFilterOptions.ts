import { useQuery } from "@tanstack/react-query";
import { getFilterOptions } from "@/lib/supabase/courses";

interface FilterOptions {
  colleges: string[];
  credits: string[];
  levels: string[];
  requirements: string[];
}

export function useFilterOptions() {
  const {
    data: options = {
      colleges: [],
      credits: [],
      levels: [],
      requirements: [],
    },
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: getFilterOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    options: options as FilterOptions,
    loading,
    error: error as Error | null,
  };
}
