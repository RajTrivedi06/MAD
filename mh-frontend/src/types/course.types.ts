import type { Database } from "@/lib/supabase/database.types";

export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type RequirementPopularity =
  Database["public"]["Tables"]["requirement_popularity"]["Row"];

export interface CourseWithPopularity extends Course {
  popularity_stats?: {
    percent_taken: number;
    student_count: number;
    requirement: string | null;
  }[];
}

export interface CourseFilters {
  searchQuery?: string;
  college?: string[];
  credits?: string[];
  level?: string[];
  crosslisted?: boolean | null;
  lastTaughtWithin?: string;
  limit?: number;
  offset?: number;
}

export interface CourseSearchResult {
  courses: CourseWithPopularity[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
}

export interface FilterOption {
  label: string;
  value: string;
  expandable: boolean;
}

export interface PopularityStats {
  percent_taken: number;
  student_count: number;
  requirement: string | null;
  sub_requirement?: string | null;
}
