import React, { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  OnInit,
  NodeTypes,
  EdgeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { supabase } from "@/lib/supabase/client";
import { layoutWithDagre, stripPositions } from "@/utils/layoutReactFlow";
import { graphTheme as t } from "@/styles/graphTheme";
import CourseNode from "@/components/graph/nodes/CourseNode";
import OrNode from "@/components/graph/nodes/OrNode";
import AndNode from "@/components/graph/nodes/AndNode";
import LeafNode from "@/components/graph/nodes/LeafNode";
import FancyEdge from "@/components/graph/edges/FancyEdge";

interface ReactFlowPrerequisiteGraphProps {
  courseId: number;
  className?: string;
  onNodeClick?: (courseId: number) => void;
  completedCourses?: number[]; // reserved for future styling
  inProgressCourses?: number[]; // reserved for future styling
  showPrompt?: boolean; // ask before showing the diagram
}

const nodeTypes: NodeTypes = {
  course: CourseNode,
  or: OrNode,
  and: AndNode,
  leaf: LeafNode,
};

const edgeTypes: EdgeTypes = {
  default: FancyEdge,
};

function Legend() {
  return (
    <div
      style={{
        position: "absolute",
        right: 14,
        top: 14,
        background: "rgba(17,19,26,0.88)",
        border: "1px solid #242735",
        color: "#e5e7eb",
        borderRadius: 12,
        padding: "10px 12px",
        fontSize: 12,
        backdropFilter: "blur(6px)",
        zIndex: 10,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Legend</div>
      <div>■ Course</div>
      <div>⬭ OR Gate</div>
      <div>◆ AND Gate</div>
      <div>▭ Requirement</div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Tip: Click a node for details
      </div>
    </div>
  );
}

export const ReactFlowPrerequisiteGraph: React.FC<
  ReactFlowPrerequisiteGraphProps
> = ({
  courseId,
  className = "",
  onNodeClick,
  completedCourses = [],
  inProgressCourses = [],
  showPrompt = true,
}) => {
  const [showDiagram, setShowDiagram] = useState(!showPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const fetchGraphData = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      setGraphData(null);

      const { data, error: supabaseError } = await supabase
        .from("prereq_dags")
        .select("reactflow_dag_json")
        .eq("course_id", id)
        .single();

      if (supabaseError) throw supabaseError;

      if (!data?.reactflow_dag_json) {
        throw new Error("NoData");
      }

      const parsed =
        typeof data.reactflow_dag_json === "string"
          ? JSON.parse(data.reactflow_dag_json)
          : data.reactflow_dag_json;

      if (!parsed?.nodes?.length) {
        throw new Error("NoData");
      }

      setGraphData(parsed);
    } catch (err: any) {
      if (err?.message === "NoData") {
        setError(`No prerequisite data available for course ${id}`);
      } else {
        setError(
          `Failed to load prerequisite diagram: ${
            err?.message || "Unknown error"
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showDiagram && courseId) {
      fetchGraphData(courseId);
    }
  }, [showDiagram, courseId]); // do NOT include fetchGraphData to avoid re-render loops

  // Normalize node types from API data into our custom nodeTypes
  function normalizeNodeType(n: Node): Node {
    if (
      n.type &&
      (n.type === "course" ||
        n.type === "or" ||
        n.type === "and" ||
        n.type === "leaf")
    ) {
      return n;
    }
    const dt = (n as any)?.data;
    const gate = (dt?.nodeType || dt?.type || dt?.label)
      ?.toString()
      .toUpperCase();
    if (gate === "AND") return { ...n, type: "and" } as Node;
    if (gate === "OR") return { ...n, type: "or" } as Node;
    if (typeof dt?.courseId === "number" || typeof dt?.course_id === "number") {
      return { ...n, type: "course" } as Node;
    }
    return { ...n, type: "leaf" } as Node;
  }

  // Layout nodes/edges whenever graphData changes
  useEffect(() => {
    if (!graphData) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const normalized = (graphData.nodes as Node[]).map(normalizeNodeType);
    const cleanedNodes = stripPositions(normalized);
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutWithDagre(
      cleanedNodes,
      (graphData.edges as Edge[]) || [],
      { direction: "LR", nodeSep: 40, rankSep: 90 }
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graphData]);

  const onInit: OnInit = (instance) => {
    try {
      instance.fitView({ padding: 0.2, includeHiddenNodes: true });
    } catch {}
  };

  if (!showDiagram) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-64 ${className}`}
      >
        <p className="text-gray-700 mb-4">
          Do you want to view the prerequisite diagram for this course?
        </p>
        <button
          onClick={() => setShowDiagram(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Show Diagram
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center p-4 ${className}`}>
        Loading prerequisite diagram…
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-4 text-red-600 ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  if (!nodes.length && !edges.length) {
    return null;
  }

  return (
    <div
      className={`w-full h-[600px] ${className}`}
      style={{ background: t.bg, position: "relative" }}
    >
      <Legend />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "default", animated: true }}
        onNodeClick={(_, node) => {
          const courseIdFromData =
            (node as any)?.data?.courseId ?? (node as any)?.data?.course_id;
          const numericId =
            typeof courseIdFromData === "number"
              ? courseIdFromData
              : Number(node.id);
          if (onNodeClick && !Number.isNaN(numericId)) {
            onNodeClick(numericId);
          }
        }}
        onInit={onInit}
        fitView
        panOnScroll
        snapToGrid
        snapGrid={[10, 10]}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={2} color="#2b2f3a" />
        <MiniMap pannable zoomable maskColor="rgba(11,12,16,0.92)" />
        <Controls position="bottom-left" />
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <marker
              id="arrow"
              markerWidth="12"
              markerHeight="12"
              refX="12"
              refY="6"
              orient="auto"
            >
              <path d="M0,0 L12,6 L0,12 z" fill="#9aa4b2" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
};
