import { useState, useEffect } from "react";
import { PrerequisiteGraphData } from "@/utils/convertDag";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface UsePrerequisiteGraphReturn {
  data: PrerequisiteGraphData | null;
  loading: boolean;
  error: string | null;
  fetchGraph: (courseId: number) => Promise<void>;
}

export function usePrerequisiteGraph(): UsePrerequisiteGraphReturn {
  const [data, setData] = useState<PrerequisiteGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = async (courseId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/prerequisites/simple-graph/${courseId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      // Transform the backend response to match our interface
      const transformedData: PrerequisiteGraphData = {
        course_id: result.course_id,
        main_course: result.main_course,
        dag: result.dag,
        course_metadata: result.course_metadata,
        total_courses: result.total_courses,
      };

      setData(transformedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching prerequisite graph:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchGraph,
  };
}
