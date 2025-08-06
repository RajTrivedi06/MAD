import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Database,
} from "lucide-react";
import {
  useCoursePrerequisites,
  type PrerequisiteCourse,
} from "@/hooks/usePrerequisites";

interface PrerequisiteDisplayProps {
  courseId: number;
  className?: string;
}

export function PrerequisiteDisplay({
  courseId,
  className = "",
}: PrerequisiteDisplayProps) {
  const {
    prerequisiteData,
    prerequisiteTree,
    prerequisiteStats,
    loading,
    error,
  } = useCoursePrerequisites(courseId);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview"])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading prerequisites...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>Error loading prerequisites: {error}</span>
        </div>
      </div>
    );
  }

  if (!prerequisiteData || prerequisiteData.total_prerequisites === 0) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
        <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Prerequisites
        </h3>
        <p className="text-gray-600">No prerequisites found for this course.</p>
      </div>
    );
  }

  const renderPrerequisiteCard = (
    course: PrerequisiteCourse,
    index: number
  ) => (
    <motion.div
      key={course.course_id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{course.course_code}</h4>
        <span className="text-sm text-gray-500">{course.level}</span>
      </div>
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{course.title}</p>
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.credits} credits
        </span>
        {course.college && (
          <span className="text-gray-500">{course.college}</span>
        )}
      </div>
    </motion.div>
  );

  const renderTreeLevel = (
    depth: number,
    courses: Array<PrerequisiteCourse & { path: number[] }>
  ) => (
    <div key={depth} className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        Level {depth} Prerequisites
        <span className="text-xs text-gray-500">
          ({courses.length} courses)
        </span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
        {courses.map((course, index) => renderPrerequisiteCard(course, index))}
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      <h3 className="font-semibold text-black mb-6 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Prerequisites
        {prerequisiteStats && (
          <span className="text-sm font-normal text-gray-500">
            ({prerequisiteStats.total_prerequisites} total)
          </span>
        )}
      </h3>

      {/* Overview Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("overview")}
          className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-900 hover:text-gray-700"
        >
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Overview
          </span>
          {expandedSections.has("overview") ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has("overview") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {prerequisiteStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {prerequisiteStats.total_prerequisites}
                      </div>
                      <div className="text-xs text-gray-600">Total Prereqs</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {prerequisiteStats.max_depth}
                      </div>
                      <div className="text-xs text-gray-600">Max Depth</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {prerequisiteStats.average_credits?.toFixed(1) || "N/A"}
                      </div>
                      <div className="text-xs text-gray-600">Avg Credits</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {prerequisiteStats.prerequisite_colleges.length}
                      </div>
                      <div className="text-xs text-gray-600">Colleges</div>
                    </div>
                  </div>
                )}

                {/* Query Optimization Info */}
                {prerequisiteData.query_optimization && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {prerequisiteData.query_optimization.strategy}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {prerequisiteData.query_optimization.performance_notes}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prerequisites List Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("list")}
          className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-900 hover:text-gray-700"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            All Prerequisites ({prerequisiteData.prerequisite_courses.length})
          </span>
          {expandedSections.has("list") ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has("list") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prerequisiteData.prerequisite_courses.map((course, index) =>
                    renderPrerequisiteCard(course, index)
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prerequisite Tree Section */}
      {prerequisiteTree && prerequisiteTree.max_depth > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection("tree")}
            className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-900 hover:text-gray-700"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Prerequisite Tree (Depth: {prerequisiteTree.max_depth})
            </span>
            {expandedSections.has("tree") ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has("tree") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-6">
                  {Object.entries(prerequisiteTree.tree_by_depth)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([depth, courses]) =>
                      renderTreeLevel(parseInt(depth), courses)
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
