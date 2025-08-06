import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { usePrerequisiteGraph } from "@/hooks/usePrerequisiteGraph";
import { convertDagToReactFlow, markMainCourse } from "@/utils/convertDag";
import CourseCardNode from "@/components/CourseCardNode";
import LogicNode from "@/components/LogicNode";

// Define custom node types
const nodeTypes = {
  courseCard: CourseCardNode,
  logicNode: LogicNode,
};

export default function TestPrereqGraph() {
  const [courseId, setCourseId] = useState<number>(1); // Default course ID
  const { data, loading, error, fetchGraph } = usePrerequisiteGraph();

  // Convert DAG to React Flow format when data is available
  const { nodes, edges } = useMemo(() => {
    if (!data?.dag || !data?.course_metadata) {
      return { nodes: [], edges: [] };
    }

    const { nodes: rfNodes, edges: rfEdges } = convertDagToReactFlow(
      data.dag,
      data.course_metadata
    );

    // Mark the main course
    const nodesWithMainCourse = markMainCourse(rfNodes, data.course_id);

    return { nodes: nodesWithMainCourse, edges: rfEdges };
  }, [data]);

  // Handle course ID change
  const handleCourseIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newId = parseInt(e.target.value);
      if (!isNaN(newId) && newId > 0) {
        setCourseId(newId);
      }
    },
    []
  );

  // Fetch graph for the specified course
  const handleFetchGraph = useCallback(() => {
    fetchGraph(courseId);
  }, [courseId, fetchGraph]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Prerequisite Graph Test Page
          </h1>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="courseId"
                className="text-sm font-medium text-gray-700"
              >
                Course ID:
              </label>
              <input
                id="courseId"
                type="number"
                value={courseId}
                onChange={handleCourseIdChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
            <button
              onClick={handleFetchGraph}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Fetch Graph"}
            </button>
          </div>

          {/* Status */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">Error: {error}</p>
            </div>
          )}

          {/* Graph Info */}
          {data && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">
                    Main Course:
                  </span>
                  <p className="text-blue-700">
                    {data.main_course.course_code} - {data.main_course.title}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-900">
                    Total Courses:
                  </span>
                  <p className="text-blue-700">{data.total_courses}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-900">
                    Graph Nodes:
                  </span>
                  <p className="text-blue-700">
                    {nodes.length} nodes, {edges.length} edges
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* React Flow Graph */}
      <div className="flex-1 h-[calc(100vh-200px)]">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-gray-50"
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.isMainCourse) return "#3b82f6";
                if (node.data?.isLogicNode) {
                  return node.data.type === "AND" ? "#10b981" : "#f59e0b";
                }
                return "#6b7280";
              }}
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-700">Loading prerequisite graph...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
