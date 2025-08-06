import React from "react";
import ReactFlow, { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

export default function MinimalReactFlowTest() {
  const nodes: Node[] = [
    {
      id: "1",
      type: "default",
      position: { x: 100, y: 100 },
      data: { label: "Test Node 1" },
    },
    {
      id: "2",
      type: "default",
      position: { x: 300, y: 100 },
      data: { label: "Test Node 2" },
    },
  ];

  const edges: Edge[] = [
    {
      id: "e1-2",
      source: "1",
      target: "2",
      type: "smoothstep",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Minimal React Flow Test</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Basic React Flow Test</h2>

        <div className="h-[400px] border border-gray-200 rounded">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            proOptions={{ hideAttribution: true }}
          />
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            ✅ If you see two connected nodes above, React Flow is working
            correctly.
          </p>
        </div>
      </div>
    </div>
  );
}
