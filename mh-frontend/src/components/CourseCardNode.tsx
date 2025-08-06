import React from "react";
import { Handle, Position } from "reactflow";
import { CourseMetadata } from "@/utils/convertDag";

interface CourseCardNodeData extends CourseMetadata {
  courseId: string;
  isMainCourse?: boolean;
}

interface CourseCardNodeProps {
  data: CourseCardNodeData;
}

export default function CourseCardNode({ data }: CourseCardNodeProps) {
  const {
    course_code,
    title,
    description,
    credits,
    level,
    college,
    isMainCourse = false,
  } = data;

  return (
    <div
      className={`
        relative bg-white border-2 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[300px]
        ${
          isMainCourse
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }
        transition-all duration-200 hover:shadow-xl
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Course header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h3
            className={`font-bold text-sm ${
              isMainCourse ? "text-blue-700" : "text-gray-800"
            }`}
          >
            {course_code}
          </h3>
          {isMainCourse && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Main Course
            </span>
          )}
        </div>
        <h4 className="font-semibold text-sm text-gray-900 leading-tight">
          {title}
        </h4>
      </div>

      {/* Course details */}
      <div className="space-y-1 text-xs text-gray-600">
        {description && (
          <p className="line-clamp-2 leading-relaxed">{description}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {credits && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
              {credits} credits
            </span>
          )}
          {level && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
              {level}
            </span>
          )}
          {college && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
              {college}
            </span>
          )}
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
