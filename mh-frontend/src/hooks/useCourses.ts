import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type {
  CourseFilters,
  CourseWithRequirements,
} from "@/types/course.types";

type Course = Database["public"]["Tables"]["courses"]["Row"];

type JoinedCourseRow = Course & {
  requirement_popularity?:
    | {
        percent_taken: number;
        student_count: number;
        requirement: string | null;
      }[]
    | null;
  course_requirements?:
    | { breadth_or: string[] | null; gened_and: string[] | null }
    | Array<{ breadth_or: string[] | null; gened_and: string[] | null }>
    | null;
};

export function useCourses(filters: CourseFilters = {}) {
  const [courses, setCourses] = useState<CourseWithRequirements[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCourses();
  }, [
    filters.searchQuery,
    filters.catalogNumber,
    filters.term,
    filters.courseCode?.join(","),
    filters.college?.join(","),
    filters.level?.join(","),
    filters.credits?.join(","),
    filters.crosslisted,
    filters.breadth?.join(","),
    filters.generalEducation?.join(","),
    filters.repeatable,
    filters.cloAudience?.join(","),
    filters.limit,
    filters.offset,
  ]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start building the query with joins
      const wantsCRFilter =
        (filters.breadth && filters.breadth.length > 0) ||
        (filters.generalEducation && filters.generalEducation.length > 0);

      const crJoin = wantsCRFilter
        ? "course_requirements!inner ( breadth_or, gened_and )"
        : "course_requirements!left ( breadth_or, gened_and )";

      let query = supabase.from("courses").select(
        `
          *,
          requirement_popularity!left (
            percent_taken,
            student_count,
            requirement
          ),
          ${crJoin}
        `,
        { count: "exact" }
      );

      // Apply keyword search across multiple fields
      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,course_code.ilike.%${filters.searchQuery}%`
        );
      }

      // Apply catalog number filter (exact match for "Add by class number")
      if (filters.catalogNumber) {
        query = query.eq("catalog_number", filters.catalogNumber);
      }

      // Apply term filter (using last_taught_term)
      if (filters.term) {
        query = query.eq("last_taught_term", filters.term);
      }

      // Apply course code filter (subject filter)
      if (filters.courseCode && filters.courseCode.length > 0) {
        // Build an OR query for course codes that start with any of the selected subjects
        const courseCodeFilters = filters.courseCode
          .map((code) => `course_code.ilike.${code}%`)
          .join(",");
        query = query.or(courseCodeFilters);
      }

      // Apply college filter
      if (filters.college && filters.college.length > 0) {
        query = query.in("college", filters.college);
      }

      // Apply level filter
      if (filters.level && filters.level.length > 0) {
        query = query.in("level", filters.level);
      }

      // Apply credits filter
      if (filters.credits && filters.credits.length > 0) {
        query = query.in("credits", filters.credits);
      }

      // Apply crosslisted filter
      if (filters.crosslisted !== null && filters.crosslisted !== undefined) {
        query = query.eq("crosslisted", filters.crosslisted);
      }

      // Apply repeatable filter
      if (filters.repeatable !== null && filters.repeatable !== undefined) {
        query = query.eq("repeatable", filters.repeatable);
      }

      // Apply CLO audience filter
      if (filters.cloAudience && filters.cloAudience.length > 0) {
        query = query.in("clo_audience", filters.cloAudience);
      }

      // Apply breadth filter (array overlap on related table)
      if (filters.breadth && filters.breadth.length > 0) {
        query = query.overlaps(
          "course_requirements.breadth_or",
          filters.breadth as string[]
        );
      }

      // Apply general education filter (array overlap on related table)
      if (filters.generalEducation && filters.generalEducation.length > 0) {
        query = query.overlaps(
          "course_requirements.gened_and",
          filters.generalEducation as string[]
        );
      }

      // Add pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by course code and catalog number for consistent results
      query = query
        .order("course_code", { ascending: true })
        .order("catalog_number", { ascending: true });

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform and map nested joins
      const rows = (data as unknown as JoinedCourseRow[]) || [];
      const coursesWithRequirements = rows.map((item) => {
        const { requirement_popularity, course_requirements, ...courseData } =
          item as JoinedCourseRow;

        const crArr = Array.isArray(course_requirements)
          ? course_requirements
          : course_requirements
          ? [course_requirements]
          : [];
        const crFirst = crArr[0];

        return {
          ...(courseData as unknown as CourseWithRequirements),
          popularity_stats: requirement_popularity || [],
          course_requirements: crFirst
            ? {
                breadth_or: (crFirst.breadth_or as string[] | null) ?? [],
                gened_and: (crFirst.gened_and as string[] | null) ?? [],
              }
            : { breadth_or: [], gened_and: [] },
        } as CourseWithRequirements;
      });

      // Server-side filtering used above; no client-side filtering necessary

      setCourses(coursesWithRequirements);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { courses, loading, error, totalCount, refetch: fetchCourses };
}
