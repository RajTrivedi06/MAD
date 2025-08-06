import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Lock,
  BookOpen,
  Loader2,
  XCircle,
  GraduationCap,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PrerequisiteNodeData,
  LogicNodeData,
  CourseStatus,
} from "@/types/prerequisite.types";

export const PrerequisiteNode = memo<NodeProps<PrerequisiteNodeData>>(
  ({ data, selected }) => {
    const statusConfig = {
      completed: {
        bg: "bg-green-50 border-green-500",
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        text: "text-green-900",
        ring: "ring-green-500/20",
      },
      "in-progress": {
        bg: "bg-yellow-50 border-yellow-500",
        icon: <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />,
        text: "text-yellow-900",
        ring: "ring-yellow-500/20",
      },
      available: {
        bg: "bg-blue-50 border-blue-500",
        icon: <BookOpen className="w-4 h-4 text-blue-600" />,
        text: "text-blue-900",
        ring: "ring-blue-500/20",
      },
      locked: {
        bg: "bg-gray-50 border-gray-300",
        icon: <Lock className="w-4 h-4 text-gray-500" />,
        text: "text-gray-700",
        ring: "ring-gray-500/20",
      },
      planned: {
        bg: "bg-purple-50 border-purple-500",
        icon: <Clock className="w-4 h-4 text-purple-600" />,
        text: "text-purple-900",
        ring: "ring-purple-500/20",
      },
      failed: {
        bg: "bg-red-50 border-red-500",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        text: "text-red-900",
        ring: "ring-red-500/20",
      },
    };

    const config = statusConfig[data.status];

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "px-4 py-3 rounded-lg border-2 shadow-sm min-w-[200px] max-w-[250px]",
          config.bg,
          config.ring,
          data.isMainCourse && "ring-2 ring-red-500 ring-offset-2",
          selected && "shadow-lg ring-2 ring-blue-500",
          "hover:shadow-md transition-all duration-200"
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 hover:!bg-gray-600 transition-colors"
        />

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className={cn("font-semibold text-sm truncate", config.text)}>
              {data.label}
            </div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">
              {data.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {data.credits} credits
              </span>
              {data.level && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {data.level}
                </span>
              )}
            </div>
            {data.college && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Building className="w-3 h-3" />
                <span className="truncate">{data.college}</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">{config.icon}</div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-gray-400 hover:!bg-gray-600 transition-colors"
        />
      </motion.div>
    );
  }
);

PrerequisiteNode.displayName = "PrerequisiteNode";

// Custom comparison function for React.memo optimization
const areEqual = (
  prevProps: NodeProps<PrerequisiteNodeData>,
  nextProps: NodeProps<PrerequisiteNodeData>
) => {
  return (
    prevProps.data.status === nextProps.data.status &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.courseId === nextProps.data.courseId &&
    prevProps.data.isMainCourse === nextProps.data.isMainCourse &&
    prevProps.data.label === nextProps.data.label &&
    prevProps.data.title === nextProps.data.title
  );
};

// Optimized version with custom comparison
export const OptimizedPrerequisiteNode = memo<NodeProps<PrerequisiteNodeData>>(
  ({ data, selected }) => {
    const statusConfig = {
      completed: {
        bg: "bg-green-50 border-green-500",
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        text: "text-green-900",
        ring: "ring-green-500/20",
      },
      "in-progress": {
        bg: "bg-yellow-50 border-yellow-500",
        icon: <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />,
        text: "text-yellow-900",
        ring: "ring-yellow-500/20",
      },
      available: {
        bg: "bg-blue-50 border-blue-500",
        icon: <BookOpen className="w-4 h-4 text-blue-600" />,
        text: "text-blue-900",
        ring: "ring-blue-500/20",
      },
      locked: {
        bg: "bg-gray-50 border-gray-300",
        icon: <Lock className="w-4 h-4 text-gray-500" />,
        text: "text-gray-700",
        ring: "ring-gray-500/20",
      },
      planned: {
        bg: "bg-purple-50 border-purple-500",
        icon: <Clock className="w-4 h-4 text-purple-600" />,
        text: "text-purple-900",
        ring: "ring-purple-500/20",
      },
      failed: {
        bg: "bg-red-50 border-red-500",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        text: "text-red-900",
        ring: "ring-red-500/20",
      },
    };

    const config = statusConfig[data.status];

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "px-4 py-3 rounded-lg border-2 shadow-sm min-w-[200px] max-w-[250px]",
          config.bg,
          config.ring,
          data.isMainCourse && "ring-2 ring-red-500 ring-offset-2",
          selected && "shadow-lg ring-2 ring-blue-500",
          "hover:shadow-md transition-all duration-200"
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 hover:!bg-gray-600 transition-colors"
        />

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className={cn("font-semibold text-sm truncate", config.text)}>
              {data.label}
            </div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">
              {data.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {data.credits} credits
              </span>
              {data.level && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {data.level}
                </span>
              )}
            </div>
            {data.college && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Building className="w-3 h-3" />
                <span className="truncate">{data.college}</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">{config.icon}</div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-gray-400 hover:!bg-gray-600 transition-colors"
        />
      </motion.div>
    );
  },
  areEqual
);

OptimizedPrerequisiteNode.displayName = "OptimizedPrerequisiteNode";

// Logic node for AND/OR operations
export const LogicNode = memo<NodeProps<LogicNodeData>>(({ data }) => {
  const isAnd = data.nodeType === "AND";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "px-4 py-2 rounded-full border-2 shadow-sm font-medium text-sm",
        isAnd
          ? "bg-blue-50 border-blue-300 text-blue-700"
          : "bg-orange-50 border-orange-300 text-orange-700",
        "hover:shadow-md transition-all duration-200"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-gray-400"
      />

      <div className="flex items-center gap-2">
        <span className="font-bold">{data.nodeType}</span>
        <span className="text-xs opacity-75">({data.label})</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-gray-400"
      />
    </motion.div>
  );
});

LogicNode.displayName = "LogicNode";

// Legend component for status indicators
export const PrerequisiteLegend: React.FC = () => {
  const legendItems = [
    {
      status: "completed" as CourseStatus,
      color: "bg-green-500",
      label: "Completed",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    {
      status: "in-progress" as CourseStatus,
      color: "bg-yellow-500",
      label: "In Progress",
      icon: <Loader2 className="w-3 h-3" />,
    },
    {
      status: "available" as CourseStatus,
      color: "bg-blue-500",
      label: "Available",
      icon: <BookOpen className="w-3 h-3" />,
    },
    {
      status: "planned" as CourseStatus,
      color: "bg-purple-500",
      label: "Planned",
      icon: <Clock className="w-3 h-3" />,
    },
    {
      status: "locked" as CourseStatus,
      color: "bg-gray-300",
      label: "Locked",
      icon: <Lock className="w-3 h-3" />,
    },
    {
      status: "failed" as CourseStatus,
      color: "bg-red-500",
      label: "Failed",
      icon: <XCircle className="w-3 h-3" />,
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border">
      <h3 className="font-semibold text-sm text-gray-900 mb-2">
        Course Status
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {legendItems.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${item.color} flex items-center justify-center text-white`}
            >
              {item.icon}
            </div>
            <span className="text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Tooltip component for node details
export const NodeTooltip: React.FC<{
  data: PrerequisiteNodeData;
  visible: boolean;
  position: { x: number; y: number };
}> = ({ data, visible, position }) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: "translateY(-100%)",
      }}
    >
      <div className="space-y-2">
        <div className="font-semibold text-sm">{data.label}</div>
        <div className="text-xs text-gray-600">{data.title}</div>
        <div className="text-xs text-gray-500">
          <div>Credits: {data.credits}</div>
          <div>Level: {data.level}</div>
          {data.college && <div>College: {data.college}</div>}
          {data.lastTaughtTerm && <div>Last Taught: {data.lastTaughtTerm}</div>}
        </div>
        <div className="text-xs font-medium capitalize">
          Status: {data.status.replace("-", " ")}
        </div>
      </div>
    </motion.div>
  );
};
