import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

// TEMPORARY: Import test converter
import {
  convertD3ToReactFlow,
  testD3Data,
} from "@/utils/d3ToReactFlowConverter";

// Add this flag at the top of the file
const USE_MOCK_DATA = true; // Set to false to use real data

export interface PrereqNode {
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

export interface PrereqEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export interface PrereqDAGData {
  nodes: PrereqNode[];
  edges: PrereqEdge[];
}

export const usePrerequisiteDAG = (courseId: number | null) => {
  const [dagData, setDagData] = useState<PrereqDAGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    if (!courseId) {
      setDagData(null);
      return;
    }

    // Handle mock data synchronously
    if (USE_MOCK_DATA) {
      setDebugInfo("Processing mock data...");
      setLoading(true);

      try {
        setDebugInfo("Converting D3 data...");
        const converted = convertD3ToReactFlow(testD3Data, courseId);

        // Simulate enriched data
        setDebugInfo("Enriching nodes...");
        const enrichedNodes = converted.nodes.map((node) => {
          // Add mock titles for better visualization
          const mockTitles: Record<string, string> = {
            "MATH 211": "Calculus I",
            "MATH 221": "Calculus II",
            "ECON 301": "Intermediate Microeconomics",
            "STAT 301": "Intro to Statistical Methods",
            "A A E/ECON 526": "Applied Econometrics",
          };

          return {
            ...node,
            data: {
              ...node.data,
              title: mockTitles[node.id] || node.id,
              credits: node.id.includes("MATH") ? "5" : "3",
            },
          };
        });

        const finalData = {
          nodes: enrichedNodes,
          edges: converted.edges,
        };

        setDebugInfo("Setting final data...");
        setDagData(finalData);
        setDebugInfo("Mock data processing complete");
      } catch (err) {
        console.error("Error in mock data:", err);
        setDebugInfo(`Error: ${err}`);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
      return;
    }

    const fetchDAGData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch the DAG data
        const { data: dagResult, error: dagError } = await supabase
          .from("prereq_dag")
          .select("reactflow_dag_json")
          .eq("course_id", courseId)
          .single();

        if (dagError) throw dagError;

        if (!dagResult?.reactflow_dag_json) {
          setDagData(null);
          return;
        }

        // Parse the DAG data
        const parsedDAG = dagResult.reactflow_dag_json as PrereqDAGData;

        // Fetch additional course information for all nodes
        const courseIds = parsedDAG.nodes
          .map((node) => node.data.courseId)
          .filter(Boolean);

        if (courseIds.length > 0) {
          const { data: coursesData, error: coursesError } = await supabase
            .from("courses")
            .select("course_id, course_code, title, credits, description")
            .in("course_id", courseIds);

          if (coursesError) throw coursesError;

          // Enrich nodes with course information
          const coursesMap = new Map(
            coursesData?.map((course) => [course.course_id, course]) || []
          );

          const enrichedNodes = parsedDAG.nodes.map((node) => {
            const courseInfo = coursesMap.get(node.data.courseId);
            if (courseInfo) {
              return {
                ...node,
                data: {
                  ...node.data,
                  courseCode: courseInfo.course_code,
                  title: courseInfo.title,
                  credits: courseInfo.credits,
                  description: courseInfo.description,
                },
              };
            }
            return node;
          });

          setDagData({
            ...parsedDAG,
            nodes: enrichedNodes,
          });
        } else {
          setDagData(parsedDAG);
        }
      } catch (err) {
        console.error("Error fetching prerequisite DAG:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDAGData();
  }, [courseId]);

  return { dagData, loading, error, debugInfo };
};
