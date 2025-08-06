import React from "react";
import { Handle, Position } from "reactflow";

interface LogicNodeData {
  label: string;
  type: "AND" | "OR";
  isLogicNode: boolean;
}

interface LogicNodeProps {
  data: LogicNodeData;
}

export default function LogicNode({ data }: LogicNodeProps) {
  const { label, type } = data;
  const isAnd = type === "AND";

  return (
    <div
      className={`
        relative bg-white border-2 rounded-lg shadow-md p-3 min-w-[80px] max-w-[100px]
        ${
          isAnd
            ? "border-green-500 bg-green-50"
            : "border-orange-500 bg-orange-50"
        }
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Logic symbol */}
      <div className="text-center">
        <div
          className={`
          font-bold text-lg mb-1
          ${isAnd ? "text-green-700" : "text-orange-700"}
        `}
        >
          {isAnd ? "∧" : "∨"}
        </div>
        <div
          className={`
          text-xs font-semibold uppercase tracking-wide
          ${isAnd ? "text-green-600" : "text-orange-600"}
        `}
        >
          {label}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
}
