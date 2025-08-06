import React, { useState, useEffect } from "react";
import {
  convertD3ToReactFlow,
  testD3Data,
} from "@/utils/d3ToReactFlowConverter";
import { usePrerequisiteDAG } from "@/hooks/usePrerequisiteDAG";
import { PrerequisiteJourneyWrapper } from "@/components/PrerequisiteJourneyWrapper";

export default function D3ReactFlowTestPage() {
  const [activeTab, setActiveTab] = useState<
    "converter" | "hook" | "integration"
  >("converter");
  const [courseId, setCourseId] = useState<number>(356);

  // Test the conversion directly
  const convertedData = convertD3ToReactFlow(testD3Data, courseId);

  // Test the hook
  const { dagData, loading, error, debugInfo } = usePrerequisiteDAG(courseId);

  // Mock completed courses for testing
  const completedCourses = [11619, 5565]; // MATH 211 and ECON 301
  const inProgressCourses = [18439]; // STAT 301

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">
        D3 to React Flow Comprehensive Test
      </h1>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("converter")}
            className={`px-4 py-2 font-medium ${
              activeTab === "converter"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Converter Test
          </button>
          <button
            onClick={() => setActiveTab("hook")}
            className={`px-4 py-2 font-medium ${
              activeTab === "hook"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Hook Test
          </button>
          <button
            onClick={() => setActiveTab("integration")}
            className={`px-4 py-2 font-medium ${
              activeTab === "integration"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Integration Test
          </button>
        </div>
      </div>

      {/* Course ID Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course ID:
        </label>
        <input
          type="number"
          value={courseId}
          onChange={(e) => setCourseId(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Converter Test Tab */}
      {activeTab === "converter" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Direct Converter Test</h2>

          <div className="mb-4">
            <h3 className="font-medium">
              Node Count: {convertedData.nodes.length}
            </h3>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">
              Edge Count: {convertedData.edges.length}
            </h3>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">Sample Nodes:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-64">
              {JSON.stringify(convertedData.nodes.slice(0, 3), null, 2)}
            </pre>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">Sample Edges:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-32">
              {JSON.stringify(convertedData.edges.slice(0, 3), null, 2)}
            </pre>
          </div>

          <div className="text-green-600 font-medium">
            ✅ Direct conversion successful! Data structure looks correct.
          </div>
        </div>
      )}

      {/* Hook Test Tab */}
      {activeTab === "hook" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Hook Test</h2>

          <div className="mb-4">
            <h3 className="font-medium">Loading: {loading ? "Yes" : "No"}</h3>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">
              Error: {error ? error.message : "None"}
            </h3>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">Debug Info: {debugInfo || "None"}</h3>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">
              Node Count: {dagData?.nodes?.length || 0}
            </h3>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">
              Edge Count: {dagData?.edges?.length || 0}
            </h3>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">DAG Data:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-96">
              {dagData ? JSON.stringify(dagData, null, 2) : "null"}
            </pre>
          </div>

          {dagData && dagData.nodes.length > 0 ? (
            <div className="text-green-600 font-medium">
              ✅ Hook data loaded successfully! Ready for visualization.
            </div>
          ) : (
            <div className="text-red-600 font-medium">
              ❌ No data available from hook
            </div>
          )}
        </div>
      )}

      {/* Integration Test Tab */}
      {activeTab === "integration" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Full Integration Test</h2>

          <div className="mb-4">
            <h3 className="font-medium">Test Configuration:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              <li>Course ID: {courseId}</li>
              <li>Completed Courses: {completedCourses.join(", ")}</li>
              <li>In Progress Courses: {inProgressCourses.join(", ")}</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="font-medium">Prerequisite Graph:</h3>
            <div className="border border-gray-200 rounded-lg">
              <PrerequisiteJourneyWrapper
                courseId={courseId}
                completedCourses={completedCourses}
                inProgressCourses={inProgressCourses}
                onCourseClick={(courseId) => {
                  console.log("Clicked course:", courseId);
                }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>✅ Interactive graph should display above with:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Target course (A A E/ECON 526) at the top</li>
              <li>OR/AND nodes as different styled badges</li>
              <li>Course nodes with proper styling</li>
              <li>Edges connecting nodes correctly</li>
              <li>
                Color coding (green for completed, yellow for in-progress)
              </li>
              <li>Click interactions and zoom/pan controls</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
