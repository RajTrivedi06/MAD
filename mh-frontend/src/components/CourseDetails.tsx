import {
  X,
  Clock,
  Users,
  Building2,
  Hash,
  BookOpen,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { CourseWithPopularity } from "@/types/course.types";

interface CourseDetailsProps {
  course: CourseWithPopularity;
  onClose: () => void;
}

export default function CourseDetails({ course, onClose }: CourseDetailsProps) {
  const popularity = course.popularity_stats?.[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {course.course_code} {course.catalog_number}
            </h2>
            <p className="text-gray-600 mt-1">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {course.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-700">{course.description}</p>
            </div>
          )}

          {/* Course Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Credits:</strong> {course.credits}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>College:</strong> {course.college}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Level:</strong> {course.level}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Last Taught:</strong> {course.last_taught_term}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {popularity && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">
                    <strong>Popularity:</strong>{" "}
                    {popularity.percent_taken?.toFixed(1)}%
                  </span>
                </div>
              )}

              {popularity && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">
                    <strong>Students:</strong> {popularity.student_count}
                  </span>
                </div>
              )}

              {course.crosslisted && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-700">
                    <strong>Crosslisted Course</strong>
                  </span>
                </div>
              )}

              {course.repeatable && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">
                    <strong>Repeatable Course</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Prerequisites */}
          {course.pre_requisites && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Prerequisites
              </h3>
              <p className="text-gray-700">{course.pre_requisites}</p>
            </div>
          )}

          {/* Learning Outcomes */}
          {course.learning_outcomes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Learning Outcomes
              </h3>
              <p className="text-gray-700">{course.learning_outcomes}</p>
            </div>
          )}

          {/* Audience */}
          {course.clo_audience && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Intended Audience
              </h3>
              <p className="text-gray-700">{course.clo_audience}</p>
            </div>
          )}

          {/* Popularity Details */}
          {popularity && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Course Popularity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {popularity.percent_taken?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    of students take this course
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {popularity.student_count}
                  </div>
                  <div className="text-sm text-gray-600">students enrolled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {popularity.requirement || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600">
                    fulfills requirement
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
