import React from "react";
import {
  convertD3ToReactFlow,
  testD3Data,
} from "@/utils/d3ToReactFlowConverter";

interface MockPrerequisiteDisplayProps {
  courseId: number;
  className?: string;
}

export function MockPrerequisiteDisplay({
  courseId,
  className = "",
}: MockPrerequisiteDisplayProps) {
  // Use the same mock data as the hook
  const convertedData = convertD3ToReactFlow(testD3Data, courseId);

  // Enrich nodes with mock data
  const enrichedNodes = convertedData.nodes.map((node) => {
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
    edges: convertedData.edges,
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
        📊 Prerequisites Structure (Mock Data)
      </h3>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">
          Course: A A E/ECON 526 (ID: {courseId})
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          This is a mock display using the same D3 to React Flow converted data.
        </p>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">
          Prerequisite Structure:
        </h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm space-y-2">
            <div className="font-medium">Target Course: A A E/ECON 526</div>
            <div className="ml-4">
              <div>└── OR_1 (Choose one path)</div>
              <div className="ml-4">
                <div>├── AND_2 (Complete all)</div>
                <div className="ml-4">
                  <div>├── OR_3 (Choose one)</div>
                  <div className="ml-4">
                    <div>├── MATH 211 (Calculus I)</div>
                    <div>└── MATH 221 (Calculus II)</div>
                  </div>
                  <div>├── ECON 301 (Intermediate Microeconomics)</div>
                  <div>└── STAT 301 (Intro to Statistical Methods)</div>
                </div>
                <div>└── graduate/professional standing</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Data Summary:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Nodes:</span>{" "}
            {finalData.nodes.length}
          </div>
          <div>
            <span className="font-medium">Total Edges:</span>{" "}
            {finalData.edges.length}
          </div>
          <div>
            <span className="font-medium">Course Nodes:</span>{" "}
            {finalData.nodes.filter((n) => n.data.courseId > 0).length}
          </div>
          <div>
            <span className="font-medium">Logic Nodes:</span>{" "}
            {finalData.nodes.filter((n) => n.data.courseId === 0).length}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        ✅ Using mock data - no API calls made
      </div>
    </div>
  );
}
