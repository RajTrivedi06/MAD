import { supabase } from "@/lib/supabase/client";
import { ReactFlowPrereqData } from "@/hooks/useReactFlowPrerequisites";

export async function fetchPrerequisiteData(
  courseId: number
): Promise<ReactFlowPrereqData | null> {
  console.log(
    `[fetchPrerequisiteData] Starting fetch for courseId: ${courseId}`
  );
  try {
    // First, check if the course exists
    console.log(
      `[fetchPrerequisiteData] Checking if course ${courseId} exists`
    );
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("course_id, course_code, title, credits, level, college")
      .eq("course_id", courseId)
      .single();

    console.log(`[fetchPrerequisiteData] Course query result:`, {
      courseData,
      courseError,
    });

    if (courseError || !courseData) {
      console.error(`[fetchPrerequisiteData] Course not found:`, courseError);
      return null;
    }

    console.log(
      `[fetchPrerequisiteData] Course found: ${courseData.course_code} - ${courseData.title}`
    );

    // Fetch the React Flow DAG data from prereq_dag table
    console.log(
      `[fetchPrerequisiteData] Fetching DAG data for course ${courseId}`
    );
    const { data: dagData, error: dagError } = await supabase
      .from("prereq_dag")
      .select("reactflow_dag_json")
      .eq("course_id", courseId)
      .single();

    console.log(`[fetchPrerequisiteData] DAG query result:`, {
      dagData,
      dagError,
    });

    if (dagError || !dagData?.reactflow_dag_json) {
      console.error(
        `[fetchPrerequisiteData] Prerequisite DAG data not found:`,
        dagError
      );
      return null;
    }

    console.log(
      `[fetchPrerequisiteData] Raw DAG data:`,
      dagData.reactflow_dag_json
    );

    // Parse the React Flow data
    let reactflowData;
    try {
      // Handle case where data might be a string (JSON) or already an object
      if (typeof dagData.reactflow_dag_json === "string") {
        reactflowData = JSON.parse(dagData.reactflow_dag_json);
      } else {
        reactflowData = dagData.reactflow_dag_json;
      }
      console.log(
        `[fetchPrerequisiteData] Parsed reactflow data:`,
        reactflowData
      );
    } catch (parseError) {
      console.error(
        `[fetchPrerequisiteData] Error parsing DAG JSON:`,
        parseError
      );
      return null;
    }

    // Validate the structure of reactflowData
    if (!reactflowData || typeof reactflowData !== "object") {
      console.error(
        `[fetchPrerequisiteData] Invalid reactflow data structure:`,
        reactflowData
      );
      return null;
    }

    // Ensure nodes and edges arrays exist
    if (!Array.isArray(reactflowData.nodes)) {
      console.warn(
        `[fetchPrerequisiteData] No nodes array found, setting to empty array`
      );
      reactflowData.nodes = [];
    }

    if (!Array.isArray(reactflowData.edges)) {
      console.warn(
        `[fetchPrerequisiteData] No edges array found, setting to empty array`
      );
      reactflowData.edges = [];
    }

    console.log(
      `[fetchPrerequisiteData] Validated nodes count: ${reactflowData.nodes.length}`
    );
    console.log(
      `[fetchPrerequisiteData] Validated edges count: ${reactflowData.edges.length}`
    );

    // Fetch course metadata for all nodes in the graph
    const courseIds =
      reactflowData.nodes
        ?.map((node: any) => {
          console.log(
            `[fetchPrerequisiteData] Processing node for courseId extraction:`,
            node
          );
          return node.data?.courseId;
        })
        .filter(Boolean) || [];

    console.log(
      `[fetchPrerequisiteData] Extracted course IDs from nodes:`,
      courseIds
    );

    let courseMetadata: Record<string, any> = {};

    if (courseIds.length > 0) {
      console.log(
        `[fetchPrerequisiteData] Fetching metadata for ${courseIds.length} courses`
      );
      const { data: metadataData, error: metadataError } = await supabase
        .from("courses")
        .select("course_id, course_code, title, credits, level, college")
        .in("course_id", courseIds);

      console.log(`[fetchPrerequisiteData] Metadata query result:`, {
        metadataData,
        metadataError,
      });

      if (!metadataError && metadataData) {
        courseMetadata = metadataData.reduce((acc, course) => {
          acc[course.course_id.toString()] = {
            course_id: course.course_id,
            course_code: course.course_code,
            title: course.title,
            credits: course.credits,
            level: course.level,
            college: course.college,
          };
          return acc;
        }, {} as Record<string, any>);

        console.log(
          `[fetchPrerequisiteData] Built course metadata:`,
          courseMetadata
        );
      } else {
        console.warn(
          `[fetchPrerequisiteData] Failed to fetch course metadata:`,
          metadataError
        );
      }
    }

    const result: ReactFlowPrereqData = {
      course_id: courseId,
      main_course: {
        course_id: courseData.course_id,
        course_code: courseData.course_code,
        title: courseData.title,
        credits: courseData.credits,
        level: courseData.level,
        college: courseData.college,
      },
      reactflow_data: reactflowData,
      course_metadata: courseMetadata,
      total_courses: Object.keys(courseMetadata).length,
      conversion_status: "database_fetched",
    };

    console.log(`[fetchPrerequisiteData] Final result:`, result);
    return result;
  } catch (error) {
    console.error(`[fetchPrerequisiteData] Unexpected error:`, error);
    return null;
  }
}

// Helper function to check if prerequisite data exists for a course
export async function checkPrerequisiteDataExists(
  courseId: number
): Promise<boolean> {
  console.log(
    `[checkPrerequisiteDataExists] Checking for courseId: ${courseId}`
  );
  try {
    const { data, error } = await supabase
      .from("prereq_dag")
      .select("course_id")
      .eq("course_id", courseId)
      .single();

    const exists = !error && !!data;
    console.log(
      `[checkPrerequisiteDataExists] Result for ${courseId}:`,
      exists
    );
    return exists;
  } catch (error) {
    console.error(
      `[checkPrerequisiteDataExists] Error for ${courseId}:`,
      error
    );
    return false;
  }
}

// Helper function to get all courses that have prerequisite data
export async function getCoursesWithPrerequisites(): Promise<number[]> {
  console.log(
    `[getCoursesWithPrerequisites] Fetching all courses with prerequisites`
  );
  try {
    const { data, error } = await supabase
      .from("prereq_dag")
      .select("course_id");

    if (error) {
      console.error(`[getCoursesWithPrerequisites] Error:`, error);
      return [];
    }

    const courseIds = data?.map((row) => row.course_id) || [];
    console.log(
      `[getCoursesWithPrerequisites] Found ${courseIds.length} courses with prerequisites`
    );
    return courseIds;
  } catch (error) {
    console.error(`[getCoursesWithPrerequisites] Unexpected error:`, error);
    return [];
  }
}

// Debug function to inspect database structure
export async function debugPrerequisiteTable(courseId?: number): Promise<any> {
  console.log(
    `[debugPrerequisiteTable] Starting debug for courseId: ${courseId || "all"}`
  );
  try {
    let query = supabase.from("prereq_dag").select("*");
    if (courseId) {
      query = query.eq("course_id", courseId);
    } else {
      // Just get first 5 records for general debugging
      query = query.limit(5);
    }
    const { data, error } = await query;
    console.log(`[debugPrerequisiteTable] Raw database result:`, {
      data,
      error,
    });
    if (data && data.length > 0) {
      console.log(`[debugPrerequisiteTable] Sample record structure:`, data[0]);
      // Try to parse JSON data if it exists
      data.forEach((record, index) => {
        if (record.reactflow_dag_json) {
          try {
            const parsed =
              typeof record.reactflow_dag_json === "string"
                ? JSON.parse(record.reactflow_dag_json)
                : record.reactflow_dag_json;
            console.log(
              `[debugPrerequisiteTable] Record ${index} parsed JSON:`,
              parsed
            );
          } catch (parseError) {
            console.error(
              `[debugPrerequisiteTable] Failed to parse JSON for record ${index}:`,
              parseError
            );
          }
        }
      });
    }
    return { data, error };
  } catch (error) {
    console.error(`[debugPrerequisiteTable] Unexpected error:`, error);
    return { data: null, error };
  }
}

// Function to validate the structure of reactflow data
export function validateReactFlowData(data: any): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  if (!data) {
    issues.push("Data is null or undefined");
    return { valid: false, issues };
  }
  if (typeof data !== "object") {
    issues.push("Data is not an object");
    return { valid: false, issues };
  }
  if (!data.nodes) {
    issues.push("Missing nodes property");
  } else if (!Array.isArray(data.nodes)) {
    issues.push("nodes is not an array");
  } else {
    // Validate node structure
    data.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        issues.push(`Node ${index} missing id`);
      }
      if (!node.data) {
        issues.push(`Node ${index} missing data property`);
      } else {
        if (typeof node.data.courseId === "undefined") {
          issues.push(`Node ${index} missing courseId in data`);
        }
        if (!node.data.label) {
          issues.push(`Node ${index} missing label in data`);
        }
      }
      if (!node.position) {
        issues.push(`Node ${index} missing position`);
      } else {
        if (typeof node.position.x !== "number") {
          issues.push(`Node ${index} position.x is not a number`);
        }
        if (typeof node.position.y !== "number") {
          issues.push(`Node ${index} position.y is not a number`);
        }
      }
    });
  }
  if (!data.edges) {
    issues.push("Missing edges property");
  } else if (!Array.isArray(data.edges)) {
    issues.push("edges is not an array");
  } else {
    // Validate edge structure
    data.edges.forEach((edge: any, index: number) => {
      if (!edge.id) {
        issues.push(`Edge ${index} missing id`);
      }
      if (!edge.source) {
        issues.push(`Edge ${index} missing source`);
      }
      if (!edge.target) {
        issues.push(`Edge ${index} missing target`);
      }
    });
  }
  return { valid: issues.length === 0, issues };
}
