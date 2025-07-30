import { supabase } from "./client";
import type { CourseWithPopularity } from "@/types/course.types";

export interface CourseFilters {
  searchQuery?: string;
  courseCode?: string;
  catalogNumber?: string;
  college?: string[];
  credits?: string[];
  level?: string[];
  requirement?: string[];
  crosslisted?: boolean;
  hasPrerequisites?: boolean;
  lastTaughtWithin?: number; // years
  sortBy?: "course_code" | "title" | "credits" | "popularity";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function searchCourses(filters: CourseFilters = {}) {
  try {
    let query = supabase.from("courses").select(
      `
        *,
        requirement_popularity (
          id,
          requirement,
          sub_requirement,
          percent_taken,
          student_count
        )
      `,
      { count: "exact" }
    );

    // Apply search query
    if (filters.searchQuery) {
      const searchTerm = filters.searchQuery.trim();
      query = query.or(`
        course_code.ilike.%${searchTerm}%,
        catalog_number.ilike.%${searchTerm}%,
        title.ilike.%${searchTerm}%,
        description.ilike.%${searchTerm}%
      `);
    }

    // Apply specific course code filter
    if (filters.courseCode) {
      query = query.ilike("course_code", `%${filters.courseCode}%`);
    }

    // Apply catalog number filter
    if (filters.catalogNumber) {
      query = query.eq("catalog_number", filters.catalogNumber);
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
      query = query.in("level", filters.level);
    }

    // Apply crosslisted filter
    if (filters.crosslisted !== undefined) {
      query = query.eq("crosslisted", filters.crosslisted);
    }

    // Apply prerequisites filter
    if (filters.hasPrerequisites !== undefined) {
      if (filters.hasPrerequisites) {
        query = query.not("pre_requisites", "is", null);
      } else {
        query = query.is("pre_requisites", null);
      }
    }

    // Apply last taught filter
    if (filters.lastTaughtWithin) {
      query = query.lte(
        "years_since_last_taught",
        filters.lastTaughtWithin.toString()
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || "course_code";
    const sortOrder = filters.sortOrder || "asc";

    if (sortBy === "popularity") {
      // This would require a more complex query or view
      query = query.order("course_code", { ascending: sortOrder === "asc" });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    }

    // Apply pagination
    const page = filters.page || 0;
    const pageSize = filters.pageSize || 50;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      courses: data as CourseWithPopularity[],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error("Error searching courses:", error);
    throw error;
  }
}

export async function getCourseById(courseId: number) {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select(
        `
        *,
        requirement_popularity (*),
        requirement_popularity_by_major (*)
      `
      )
      .eq("course_id", courseId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching course:", error);
    throw error;
  }
}

export async function getFilterOptions() {
  try {
    const [collegesResult, creditsResult, levelsResult, requirementsResult] =
      await Promise.all([
        // Get unique colleges
        supabase
          .from("courses")
          .select("college")
          .not("college", "is", null)
          .order("college"),

        // Get unique credits
        supabase
          .from("courses")
          .select("credits")
          .not("credits", "is", null)
          .order("credits"),

        // Get unique levels
        supabase
          .from("courses")
          .select("level")
          .not("level", "is", null)
          .order("level"),

        // Get unique requirements
        supabase
          .from("requirement_popularity")
          .select("requirement")
          .not("requirement", "is", null),
      ]);

    return {
      colleges: [...new Set(collegesResult.data?.map((c) => c.college))].filter(
        Boolean
      ),
      credits: [...new Set(creditsResult.data?.map((c) => c.credits))].filter(
        Boolean
      ),
      levels: [...new Set(levelsResult.data?.map((c) => c.level))].filter(
        Boolean
      ),
      requirements: [
        ...new Set(requirementsResult.data?.map((r) => r.requirement)),
      ].filter(Boolean),
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    throw error;
  }
}
