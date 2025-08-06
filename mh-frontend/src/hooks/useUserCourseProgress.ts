import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface UserCourseProgress {
  completedCourses: number[];
  inProgressCourses: number[];
  loading: boolean;
  error: Error | null;
}

export const useUserCourseProgress = (userId?: string): UserCourseProgress => {
  const [completedCourses, setCompletedCourses] = useState<number[]>([]);
  const [inProgressCourses, setInProgressCourses] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setCompletedCourses([]);
      setInProgressCourses([]);
      return;
    }

    const fetchUserProgress = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user's course progress
        // This assumes you have a table tracking user course enrollments/completions
        // Adjust the query based on your actual database schema

        // Example 1: If you have a user_courses table
        const { data: userCourses, error: coursesError } = await supabase
          .from("user_courses")
          .select("course_id, status")
          .eq("user_id", userId);

        if (coursesError) throw coursesError;

        // Separate completed and in-progress courses
        const completed: number[] = [];
        const inProgress: number[] = [];

        userCourses?.forEach((record) => {
          if (record.status === "completed") {
            completed.push(record.course_id);
          } else if (
            record.status === "in_progress" ||
            record.status === "enrolled"
          ) {
            inProgress.push(record.course_id);
          }
        });

        setCompletedCourses(completed);
        setInProgressCourses(inProgress);

        // Alternative: If you're using DARS data
        // const { data: darsData, error: darsError } = await supabase
        //   .from('user_dars')
        //   .select('completed_courses, in_progress_courses')
        //   .eq('user_id', userId)
        //   .single();
        //
        // if (darsError) throw darsError;
        //
        // setCompletedCourses(darsData?.completed_courses || []);
        // setInProgressCourses(darsData?.in_progress_courses || []);
      } catch (err) {
        console.error("Error fetching user course progress:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, [userId]);

  return { completedCourses, inProgressCourses, loading, error };
};

// Mock hook for testing without actual user data
export const useMockUserProgress = (): UserCourseProgress => {
  // Return some mock data for testing
  return {
    completedCourses: [1234, 5678, 9012], // Replace with actual course IDs
    inProgressCourses: [3456, 7890], // Replace with actual course IDs
    loading: false,
    error: null,
  };
};
