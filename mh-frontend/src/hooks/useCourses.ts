import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Course = Database["public"]["Tables"]["courses"]["Row"];

interface CourseWithPopularity extends Course {
  popularity_stats?: {
    percent_taken: number;
    student_count: number;
    requirement: string | null;
  }[];
}

interface UseCoursesOptions {
  searchQuery?: string;
  college?: string[];
  credits?: string[];
  level?: string[];
  crosslisted?: boolean | null;
  limit?: number;
  offset?: number;
}

export function useCourses(options: UseCoursesOptions = {}) {
  const [courses, setCourses] = useState<CourseWithPopularity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCourses();
  }, [
    options.searchQuery,
    options.college?.join(","),
    options.credits?.join(","),
    options.level?.join(","),
    options.crosslisted,
    options.limit,
    options.offset,
  ]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start building the query
      let query = supabase.from("courses").select(
        `
          *,
          requirement_popularity!inner (
            percent_taken,
            student_count,
            requirement
          )
        `,
        { count: "exact" }
      );

      // Apply search filter
      if (options.searchQuery) {
        query = query.or(
          `title.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%,course_code.ilike.%${options.searchQuery}%`
        );
      }

      // Apply college filter
      if (options.college && options.college.length > 0) {
        query = query.in("college", options.college);
      }

      // Apply credits filter
      if (options.credits && options.credits.length > 0) {
        query = query.in("credits", options.credits);
      }

      // Apply level filter
      if (options.level && options.level.length > 0) {
        // Map level names to actual values
        const levelMap: Record<string, string[]> = {
          "Elementary (100-299)": ["Elementary"],
          "Intermediate (300-699)": ["Intermediate"],
          "Advanced (700-999)": ["Advanced"],
        };

        const levelValues = options.level.flatMap((l) => levelMap[l] || [l]);
        if (levelValues.length > 0) {
          query = query.in("level", levelValues);
        }
      }

      // Apply crosslisted filter
      if (options.crosslisted !== null && options.crosslisted !== undefined) {
        query = query.eq("crosslisted", options.crosslisted);
      }

      // Add pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by course code and catalog number
      query = query
        .order("course_code", { ascending: true })
        .order("catalog_number", { ascending: true });

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Group popularity stats by course
      const coursesWithStats =
        data?.map((item) => {
          const course = { ...item };
          // Remove the nested requirement_popularity from the course object
          const { requirement_popularity, ...courseData } = course;

          return {
            ...courseData,
            popularity_stats: requirement_popularity,
          } as CourseWithPopularity;
        }) || [];

      setCourses(coursesWithStats);
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
