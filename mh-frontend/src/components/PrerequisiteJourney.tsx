import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  ConnectionMode,
  Panel,
} from "reactflow";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle,
  Lock,
  Clock,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { usePrerequisiteDAG } from "@/hooks/usePrerequisiteDAG";
import "reactflow/dist/style.css";

interface PrerequisiteJourneyProps {
  courseId: number;
  className?: string;
  onNodeClick?: (courseId: number) => void;
  completedCourses?: number[]; // Array of completed course IDs
  inProgressCourses?: number[]; // Array of in-progress course IDs
}

interface EnhancedNodeData {
  label: string;
  courseId: number;
  courseCode?: string;
  title?: string;
  credits?: string;
  description?: string;
  completed?: boolean;
  inProgress?: boolean;
  locked?: boolean;
  isTarget?: boolean;
}

// Enhanced node component with status indicators
const EnhancedCourseNode = ({ data }: { data: EnhancedNodeData }) => {
  const getStatusIcon = () => {
    if (data.completed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (data.inProgress) {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
    if (data.locked) {
      return <Lock className="w-4 h-4 text-gray-400" />;
    }
    return <BookOpen className="w-4 h-4 text-red-600" />;
  };

  const getBorderColor = () => {
    if (data.completed) return "border-green-500";
    if (data.inProgress) return "border-yellow-500";
    if (data.locked) return "border-gray-300";
    if (data.isTarget) return "border-red-600 border-4";
    return "border-gray-200";
  };

  const getBackgroundColor = () => {
    if (data.completed) return "bg-green-50";
    if (data.inProgress) return "bg-yellow-50";
    if (data.locked) return "bg-gray-50";
    if (data.isTarget) return "bg-red-50";
    return "bg-white";
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg shadow-lg border-2 ${getBorderColor()} ${getBackgroundColor()} hover:shadow-xl transition-all duration-200 min-w-[220px] cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-0"
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <h3 className="font-bold text-sm text-gray-900">
              {data.courseCode || data.label}
            </h3>
          </div>
          {data.credits && (
            <span className="text-xs text-gray-500 font-medium">
              {data.credits} cr
            </span>
          )}
        </div>
        {data.title && (
          <p className="text-xs text-gray-700 mb-2 line-clamp-2">
            {data.title}
          </p>
        )}
        {data.isTarget && (
          <div className="mt-2 text-xs font-medium text-red-600">
            Target Course
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-red-500 border-2 border-white opacity-0"
      />
    </motion.div>
  );
};

// Custom node types
const nodeTypes = {
  enhancedCourseNode: EnhancedCourseNode,
  default: EnhancedCourseNode, // Also register as default type
};

// Legend Component
const Legend = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow-lg p-4"
  >
    <h4 className="font-semibold text-sm text-gray-900 mb-3">Legend</h4>
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span>Completed</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-yellow-600" />
        <span>In Progress</span>
      </div>
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-gray-400" />
        <span>Prerequisites Not Met</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-4 border-red-600 rounded"></div>
        <span>Target Course</span>
      </div>
    </div>
  </motion.div>
);

// Course Details Panel
const CourseDetailsPanel = ({ node }: { node: Node | null }) => {
  if (!node) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="bg-white rounded-lg shadow-lg p-4 max-w-xs"
      >
        <h4 className="font-semibold text-sm text-gray-900 mb-2">
          {node.data.courseCode}
        </h4>
        <p className="text-xs text-gray-700 mb-2">{node.data.title}</p>
        {node.data.description && (
          <p className="text-xs text-gray-600 line-clamp-3">
            {node.data.description}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Credits:</span>
            <span className="font-medium">{node.data.credits}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PrerequisiteJourney: React.FC<PrerequisiteJourneyProps> = ({
  courseId,
  className = "",
  onNodeClick,
  completedCourses = [],
  inProgressCourses = [],
}) => {
  const { dagData, loading, error } = usePrerequisiteDAG(courseId);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Process nodes with status information
  const initialNodes = useMemo(() => {
    console.log("Processing initialNodes - dagData:", dagData);
    if (!dagData?.nodes) {
      console.log("No dagData.nodes, returning empty array");
      return [];
    }

    console.log("dagData.nodes length:", dagData.nodes.length);

    // Create sets for faster lookup
    const completedSet = new Set(completedCourses);
    const inProgressSet = new Set(inProgressCourses);

    const processedNodes = dagData.nodes.map((node) => {
      const isCompleted = completedSet.has(node.data.courseId);
      const isInProgress = inProgressSet.has(node.data.courseId);
      const isTarget = node.data.courseId === courseId;

      // Check if prerequisites are met (simplified logic)
      // In a real implementation, you'd check the actual prerequisite requirements
      const isLocked = !isCompleted && !isInProgress && !isTarget;

      return {
        ...node,
        type: "default", // Use default type temporarily
        data: {
          ...node.data,
          completed: isCompleted,
          inProgress: isInProgress,
          locked: isLocked,
          isTarget: isTarget,
        },
      };
    });

    console.log("Processed nodes:", processedNodes);
    return processedNodes;
  }, [dagData, completedCourses, inProgressCourses, courseId]);

  // Style edges based on node status
  const initialEdges = useMemo(() => {
    if (!dagData?.edges) return [];

    const nodeStatusMap = new Map(
      initialNodes.map((node) => [
        node.id,
        { completed: node.data.completed, inProgress: node.data.inProgress },
      ])
    );

    return dagData.edges.map((edge) => {
      const sourceStatus = nodeStatusMap.get(edge.source);
      const targetStatus = nodeStatusMap.get(edge.target);

      let edgeColor = "#d1d5db"; // gray-300
      let strokeWidth = 2;
      let animated = false;

      if (sourceStatus?.completed && targetStatus?.completed) {
        edgeColor = "#10b981"; // green-500
      } else if (sourceStatus?.completed && targetStatus?.inProgress) {
        edgeColor = "#f59e0b"; // yellow-500
        animated = true;
      } else if (sourceStatus?.completed) {
        edgeColor = "#ef4444"; // red-500
        strokeWidth = 3;
      }

      return {
        ...edge,
        type: "smoothstep",
        animated: animated,
        style: { stroke: edgeColor, strokeWidth: strokeWidth },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      };
    });
  }, [dagData, initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Debug React Flow state
  console.log("React Flow nodes:", nodes);
  console.log("React Flow edges:", edges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      if (onNodeClick && node.data.courseId) {
        onNodeClick(node.data.courseId);
      }
    },
    [onNodeClick]
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="ml-2 text-gray-600">
          Loading prerequisite journey...
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

  // Temporary debugging
  console.log("PrerequisiteJourney render - dagData:", dagData);
  console.log("PrerequisiteJourney render - dagData.nodes:", dagData?.nodes);
  console.log(
    "PrerequisiteJourney render - dagData.nodes.length:",
    dagData?.nodes?.length
  );
  console.log(
    "PrerequisiteJourney render - condition result:",
    !dagData || dagData?.nodes?.length === 0
  );

  if (!dagData || dagData.nodes.length === 0) {
    console.log("Showing 'No Prerequisites Required' message");
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Prerequisites Required
        </h3>
        <p className="text-gray-600">
          This course has no prerequisite requirements. You can enroll directly!
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-600" />
          Your Prerequisite Journey
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Visualize your path to this course. Green paths show completed
          prerequisites.
        </p>
      </div>

      <div
        className="h-[600px] w-full relative bg-gray-50"
        style={{ width: "100%", height: "600px" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.3,
            includeHiddenNodes: false,
          }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#e5e7eb"
          />
          <Controls
            className="bg-white border-gray-200 shadow-md"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.completed) return "#10b981";
              if (node.data?.inProgress) return "#f59e0b";
              if (node.data?.isTarget) return "#ef4444";
              return "#d1d5db";
            }}
            className="bg-white border-gray-200 shadow-md"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Panel position="top-left" className="space-y-4">
            <Legend />
          </Panel>
          <Panel position="top-right">
            <CourseDetailsPanel node={selectedNode} />
          </Panel>
        </ReactFlow>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Info className="w-4 h-4" />
          <span>
            Click on any course to view details. Use controls to zoom and pan.
          </span>
        </div>
      </div>
    </div>
  );
};
