import { useState, useCallback } from "react";
import { fetchPrerequisiteData } from "@/services/prerequisiteService";

export interface ReactFlowNode {
  id: string;
  type?: string;
  data: {
    label: string;
    courseId: number;
    courseCode?: string;
    title?: string;
    credits?: string;
    description?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export interface ReactFlowPrereqData {
  course_id: number;
  main_course: {
    course_id: number;
    course_code: string;
    title: string;
    credits: number;
    level: string;
    college: string;
  };
  reactflow_data: {
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
  };
  course_metadata: Record<string, unknown>;
  total_courses: number;
  conversion_status: string;
}

interface UseReactFlowPrerequisitesReturn {
  data: ReactFlowPrereqData | null;
  loading: boolean;
  error: string | null;
  fetchReactFlowData: (courseId: number) => Promise<void>;
}

export function useReactFlowPrerequisites(): UseReactFlowPrerequisitesReturn {
  const [data, setData] = useState<ReactFlowPrereqData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReactFlowData = useCallback(async (courseId: number) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch real data from the database
      const data = await fetchPrerequisiteData(courseId);

      if (!data) {
        throw new Error(
          `No prerequisite data available for course ${courseId}`
        );
      }

      setData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching React Flow prerequisite data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchReactFlowData,
  };
}
