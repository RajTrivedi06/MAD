import { useState, useEffect, useCallback } from "react";

export interface PrerequisiteCourse {
  course_id: number;
  course_code: string;
  title: string;
  credits: number | null;
  level: string | null;
  college: string | null;
  last_taught_term: string | null;
}

export interface PrerequisiteDAG {
  nodes: Array<{
    course_id: number;
    course_code: string;
    title: string;
    credits: number;
    level: string;
  }>;
  edges: Array<{
    from: number;
    to: number;
    type: string;
  }>;
  metadata: {
    total_prereqs: number;
    max_depth: number;
    last_updated: string;
  };
}

export interface PrerequisiteData {
  main_course: PrerequisiteCourse | null;
  prerequisite_courses: PrerequisiteCourse[];
  prerequisite_dag: PrerequisiteDAG | null;
  total_prerequisites: number;
  query_optimization: {
    strategy: string;
    performance_notes: string;
  };
}

export interface PrerequisiteGraphData {
  course_id: number;
  main_course: PrerequisiteCourse | null;
  dag: PrerequisiteDAG | null;
  course_metadata: Record<number, PrerequisiteCourse>;
  total_courses: number;
  user_progress?: {
    completed: number[];
    in_progress: number[];
    planned: number[];
    failed: number[];
    last_updated: string;
  };
  query_optimization: {
    strategy: string;
    performance_notes: string;
  };
}

export interface PrerequisiteTree {
  course_id: number;
  max_depth: number;
  tree_by_depth: Record<number, Array<PrerequisiteCourse & { path: number[] }>>;
  total_courses: number;
}

export interface EligibilityCheck {
  course_id: number;
  can_take: boolean;
  missing_prerequisites: {
    count: number;
    course_ids: number[];
    courses: PrerequisiteCourse[];
  };
  satisfied_prerequisites: {
    count: number;
    course_ids: number[];
    courses: PrerequisiteCourse[];
  };
}

export interface PrerequisiteStats {
  course_id: number;
  total_prerequisites: number;
  max_depth: number;
  average_credits: number | null;
  prerequisite_colleges: string[];
  prerequisite_levels: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function usePrerequisites() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrerequisites = useCallback(
    async (courseId: number): Promise<PrerequisiteData> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/prerequisites/course/${courseId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch prerequisites";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchPrerequisiteTree = useCallback(
    async (courseId: number): Promise<PrerequisiteTree> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/prerequisites/course/${courseId}/tree`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch prerequisite tree";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkEligibility = useCallback(
    async (
      courseId: number,
      completedCourseIds: number[]
    ): Promise<EligibilityCheck> => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = completedCourseIds
          .map((id) => `completed_courses=${id}`)
          .join("&");
        const response = await fetch(
          `${API_BASE_URL}/api/prerequisites/course/${courseId}/eligibility?${queryParams}`,
          { method: "POST" }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to check eligibility";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchPrerequisiteStats = useCallback(
    async (courseId: number): Promise<PrerequisiteStats> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/prerequisites/course/${courseId}/stats`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch prerequisite stats";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchPrerequisiteGraph = useCallback(
    async (
      courseId: number,
      includeUserProgress: boolean = false
    ): Promise<PrerequisiteGraphData> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (includeUserProgress) {
          params.append("include_user_progress", "true");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/prerequisites/course/${courseId}/prerequisite-graph?${params}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch prerequisite graph";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    fetchPrerequisites,
    fetchPrerequisiteTree,
    checkEligibility,
    fetchPrerequisiteStats,
    fetchPrerequisiteGraph,
    clearError,
  };
}

// Hook for managing prerequisite data for a specific course
export function useCoursePrerequisites(courseId: number | null) {
  const [prerequisiteData, setPrerequisiteData] =
    useState<PrerequisiteData | null>(null);
  const [prerequisiteTree, setPrerequisiteTree] =
    useState<PrerequisiteTree | null>(null);
  const [prerequisiteStats, setPrerequisiteStats] =
    useState<PrerequisiteStats | null>(null);

  const {
    loading,
    error,
    fetchPrerequisites,
    fetchPrerequisiteTree,
    fetchPrerequisiteStats,
    clearError,
  } = usePrerequisites();

  useEffect(() => {
    if (courseId) {
      // Fetch all prerequisite data for the course
      const loadPrerequisiteData = async () => {
        try {
          const [prereqData, treeData, statsData] = await Promise.all([
            fetchPrerequisites(courseId),
            fetchPrerequisiteTree(courseId),
            fetchPrerequisiteStats(courseId),
          ]);

          setPrerequisiteData(prereqData);
          setPrerequisiteTree(treeData);
          setPrerequisiteStats(statsData);
        } catch (err) {
          console.error("Failed to load prerequisite data:", err);
        }
      };

      loadPrerequisiteData();
    } else {
      // Clear data when no course is selected
      setPrerequisiteData(null);
      setPrerequisiteTree(null);
      setPrerequisiteStats(null);
    }
  }, [
    courseId,
    fetchPrerequisites,
    fetchPrerequisiteTree,
    fetchPrerequisiteStats,
  ]);

  return {
    prerequisiteData,
    prerequisiteTree,
    prerequisiteStats,
    loading,
    error,
    clearError,
  };
}
