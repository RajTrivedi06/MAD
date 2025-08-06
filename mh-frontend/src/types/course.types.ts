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

// Comprehensive CourseFilters interface based on actual database schema
export interface CourseFilters {
  // Text search
  searchQuery?: string;
  catalogNumber?: string; // For "Add by class number" - uses catalog_number field

  // Actual fields from database
  term?: string; // Uses last_taught_term field
  courseCode?: string[]; // Uses course_code field (subject codes)
  college?: string[]; // Uses college field
  level?: string[]; // Uses level field: Elementary, Intermediate, Advanced, No Level Assigned
  credits?: string[]; // Uses credits field
  crosslisted?: boolean | null; // Uses crosslisted field

  // From course_requirements table
  breadth?: string[]; // Uses breadth_or array
  generalEducation?: string[]; // Uses gened_and array

  // Additional filters from courses table
  repeatable?: boolean | null; // Uses repeatable field
  cloAudience?: string[]; // Uses clo_audience field: unknown, graduate, both

  // Pagination
  limit?: number;
  offset?: number;
}

// Interface that matches the actual join query results
export interface CourseWithRequirements extends Course {
  course_requirements?: {
    breadth_or?: string[];
    gened_and?: string[];
  };

  popularity_stats?: {
    percent_taken: number;
    student_count: number;
    requirement: string | null;
  }[];
}

export interface CourseSearchResult {
  courses: CourseWithRequirements[];
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

// Available filter options from the database
export const FILTER_OPTIONS = {
  colleges: [
    "Agricultural & Life Sciences",
    "Business",
    "Education",
    "Engineering",
    "Environmental Studies",
    "Human Ecology",
    "Law",
    "Letters and Science",
    "Medicine and Public Health",
    "Nursing",
    "Officer Education",
    "Pharmacy",
    "Veterinary Medicine",
  ],

  levels: ["Elementary", "Intermediate", "Advanced", "No Level Assigned"],

  breadthRequirements: [
    "Biological Science",
    "Biological Science OR Social Sciences",
    "Humanities",
    "Humanities OR Natural Sciences",
    "Humanities OR Social Sciences",
    "Literature",
    "Natural Sciences",
    "Physical Sciences",
    "Social Sciences",
    "Social Sciences OR Natural Sciences",
  ],

  generalEducationRequirements: [
    "Communication A",
    "Communication B",
    "Communication B and Ethnic Studies",
    "Ethnic Studies",
    "Quantitative Reasoning A",
    "Quantitative Reasoning B",
  ],

  cloAudiences: ["unknown", "graduate", "both"],
};
