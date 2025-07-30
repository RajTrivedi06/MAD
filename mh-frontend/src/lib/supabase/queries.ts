import { supabase } from "./client";
import type { Database } from "./database.types";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type RequirementPopularity =
  Database["public"]["Tables"]["requirement_popularity"]["Row"];

export interface CourseFilters {
  searchQuery?: string;
  college?: string[];
  credits?: string[];
  level?: string[];
  crosslisted?: boolean;
  lastTaughtWithin?: string;
  limit?: number;
  offset?: number;
}

export async function fetchCourses(filters: CourseFilters) {
  // Build base query
  let query = supabase
    .from("courses")
    .select("*, requirement_popularity(*)", { count: "exact" });

  // Apply search filter
  if (filters.searchQuery) {
    query = query.or(
      `title.ilike.%${filters.searchQuery}%,` +
        `description.ilike.%${filters.searchQuery}%,` +
        `course_code.ilike.%${filters.searchQuery}%,` +
        `catalog_number.ilike.%${filters.searchQuery}%`
    );
  }

  // Apply college filter
  if (filters.college && filters.college.length > 0) {
    query = query.in("college", filters.college);
  }

  // Apply credits filter
  if (filters.credits && filters.credits.length > 0) {
    query = query.in("credits", filters.credits);
  }

  // Apply level filter
  if (filters.level && filters.level.length > 0) {
    const levelMap: Record<string, string[]> = {
      "Elementary (100-299)": ["Elementary"],
      "Intermediate (300-699)": ["Intermediate"],
      "Advanced (700-999)": ["Advanced"],
    };

    const levelValues = filters.level.flatMap((l) => levelMap[l] || [l]);
    if (levelValues.length > 0) {
      query = query.in("level", levelValues);
    }
  }

  // Apply crosslisted filter
  if (filters.crosslisted !== undefined) {
    query = query.eq("crosslisted", filters.crosslisted);
  }

  // Apply last taught filter
  if (filters.lastTaughtWithin) {
    // This would need to be implemented based on your date format
    // query = query.gte('last_taught_term', filters.lastTaughtWithin)
  }

  // Add pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  // Order by course code and catalog number
  query = query
    .order("course_code", { ascending: true })
    .order("catalog_number", { ascending: true });

  return query;
}

export async function fetchDistinctColleges() {
  return supabase
    .from("courses")
    .select("college")
    .not("college", "is", null)
    .order("college");
}

export async function fetchDistinctCredits() {
  return supabase
    .from("courses")
    .select("credits")
    .not("credits", "is", null)
    .order("credits");
}

export async function fetchDistinctLevels() {
  return supabase
    .from("courses")
    .select("level")
    .not("level", "is", null)
    .order("level");
}

export async function fetchCourseById(courseId: number) {
  return supabase
    .from("courses")
    .select("*, requirement_popularity(*)")
    .eq("course_id", courseId)
    .single();
}

export async function fetchPopularCourses(limit = 10) {
  return supabase
    .from("courses")
    .select(
      `
      *,
      requirement_popularity!inner (
        percent_taken,
        student_count,
        requirement
      )
    `
    )
    .order("requirement_popularity.percent_taken", { ascending: false })
    .limit(limit);
}
