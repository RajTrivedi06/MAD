import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  ConnectionMode,
} from "reactflow";
import { motion } from "framer-motion";
import { BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { usePrerequisiteDAG } from "@/hooks/usePrerequisiteDAG";
import "reactflow/dist/style.css";

interface PrerequisiteGraphDisplayProps {
  courseId: number;
  className?: string;
}

// Custom node component for courses
const CourseNode = ({ data }: { data: any }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-red-500 transition-all duration-200 min-w-[200px]"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-red-600" />
          <h3 className="font-bold text-sm text-gray-900">
            {data.courseCode || data.label}
          </h3>
        </div>
        {data.title && (
          <p className="text-xs text-gray-700 mb-1 line-clamp-2">
            {data.title}
          </p>
        )}
        {data.credits && (
          <span className="text-xs text-gray-500">{data.credits} credits</span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
    </motion.div>
  );
};

// Custom node types
const nodeTypes = {
  courseNode: CourseNode,
};

export const PrerequisiteGraphDisplay: React.FC<
  PrerequisiteGraphDisplayProps
> = ({ courseId, className = "" }) => {
  const { dagData, loading, error } = usePrerequisiteDAG(courseId);

  // Initialize nodes and edges with the data from the hook
  const initialNodes = useMemo(() => {
    if (!dagData?.nodes) return [];
    return dagData.nodes.map((node) => ({
      ...node,
      type: "courseNode",
    }));
  }, [dagData]);

  const initialEdges = useMemo(() => {
    if (!dagData?.edges) return [];
    return dagData.edges.map((edge) => ({
      ...edge,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#ef4444", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#ef4444",
      },
    }));
  }, [dagData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // You can add navigation or modal opening logic here
    console.log("Node clicked:", node);
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="ml-2 text-gray-600">
          Loading prerequisite information...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-96 ${className}`}
      >
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Prerequisites
        </h3>
        <p className="text-gray-600">
          Unable to load prerequisite information.
        </p>
      </div>
    );
  }

  if (!dagData || dagData.nodes.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Prerequisites Required
        </h3>
        <p className="text-gray-600">
          This course has no prerequisite requirements.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-600" />
          Prerequisite Structure
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Interactive visualization of course prerequisites. Click and drag to
          explore.
        </p>
      </div>

      <div className="h-[500px] relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
          }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
          }}
        >
          <Background variant="dots" gap={12} size={1} className="bg-gray-50" />
          <Controls
            className="bg-white border-gray-200"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => "#ef4444"}
            className="bg-white border-gray-200"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Course Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 border-t-2 border-red-500 relative">
              <div className="absolute right-0 top-[-4px] w-0 h-0 border-l-[6px] border-l-red-500 border-y-[4px] border-y-transparent"></div>
            </div>
            <span>Prerequisite Requirement</span>
          </div>
        </div>
      </div>
    </div>
  );
};
