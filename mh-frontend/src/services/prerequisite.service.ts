import { PrerequisiteGraphResponse } from "@/types/prerequisite.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const prerequisiteService = {
  /**
   * Fetch prerequisite graph data for a course
   */
  async getPrerequisiteGraph(
    courseId: number,
    includeUserProgress: boolean = false
  ): Promise<PrerequisiteGraphResponse> {
    const params = new URLSearchParams();
    if (includeUserProgress) {
      params.append("include_user_progress", "true");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/prerequisites/course/${courseId}/prerequisite-graph?${params}`,
      {
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch prerequisite graph: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  },

  /**
   * Check course eligibility for a user
   */
  async checkUserEligibility(courseId: number, userId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/prerequisites/course/${courseId}/eligibility/user?user_id=${userId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to check eligibility: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  },

  /**
   * Check course eligibility with a list of completed courses
   */
  async checkEligibility(courseId: number, completedCourses: number[]) {
    const params = new URLSearchParams();
    completedCourses.forEach((courseId) => {
      params.append("completed_courses", courseId.toString());
    });

    const response = await fetch(
      `${API_BASE_URL}/api/prerequisites/course/${courseId}/eligibility`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed_courses: completedCourses }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to check eligibility: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  },

  /**
   * Get prerequisite statistics for a course
   */
  async getPrerequisiteStats(courseId: number) {
    const response = await fetch(
      `${API_BASE_URL}/api/prerequisites/course/${courseId}/stats`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch prerequisite stats: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  },

  /**
   * Get prerequisite tree with depth information
   */
  async getPrerequisiteTree(courseId: number) {
    const response = await fetch(
      `${API_BASE_URL}/api/prerequisites/course/${courseId}/tree`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch prerequisite tree: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  },

  /**
   * Health check for the prerequisite service
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/api/prerequisites/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  },
};
