import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { PrerequisiteJourneyWrapper } from "./PrerequisiteJourneyWrapper";
import { useUserCourseProgress } from "@/hooks/useUserCourseProgress";
import { usePrerequisiteDAG } from "@/hooks/usePrerequisiteDAG";

// Example interface for a course with requirements
interface CourseWithRequirements {
  course_id: number;
  course_code: string;
  title: string;
  pre_requisites?: string;
}

// Example auth hook interface
interface AuthUser {
  id: string;
  email: string;
}

// Mock auth hook - replace with your actual auth implementation
const useAuth = () => {
  return {
    user: { id: "user-123", email: "user@example.com" } as AuthUser,
    isAuthenticated: true,
  };
};

// Complete example of how to integrate prerequisites in your CourseSearchAI component
export const PrerequisitesTabContent = ({
  selectedCourse,
}: {
  selectedCourse: CourseWithRequirements;
}) => {
  // Get the current user
  const { user } = useAuth();

  // Fetch user's course progress
  const {
    completedCourses,
    inProgressCourses,
    loading: progressLoading,
  } = useUserCourseProgress(user?.id);

  // Handle course navigation when a prerequisite is clicked
  const handlePrerequisiteClick = (courseId: number) => {
    // Option 1: Find the course in your existing courses list and select it
    // const course = courses.find(c => c.course_id === courseId);
    // if (course) {
    //   setSelectedCourse(course);
    // }

    // Option 2: Navigate to a course detail page
    // router.push(`/courses/${courseId}`);

    // Option 3: Open in a modal
    // openCourseModal(courseId);

    console.log("Prerequisite clicked:", courseId);
  };

  return (
    <div className="space-y-6">
      {/* Main Prerequisite Visualization */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <PrerequisiteJourneyWrapper
          courseId={selectedCourse.course_id}
          completedCourses={completedCourses}
          inProgressCourses={inProgressCourses}
          onCourseClick={handlePrerequisiteClick}
        />
      </div>

      {/* Additional Prerequisite Information */}
      {selectedCourse.pre_requisites && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-3">
            Additional Requirements
          </h3>
          <p className="text-gray-700 whitespace-pre-line">
            {selectedCourse.pre_requisites}
          </p>
        </div>
      )}

      {/* Prerequisite Status Summary */}
      {!progressLoading && (
        <PrerequisiteStatusSummary
          courseId={selectedCourse.course_id}
          completedCourses={completedCourses}
          inProgressCourses={inProgressCourses}
        />
      )}
    </div>
  );
};

// Additional component for showing prerequisite completion status
const PrerequisiteStatusSummary = ({
  courseId,
  completedCourses,
  inProgressCourses,
}: {
  courseId: number;
  completedCourses: number[];
  inProgressCourses: number[];
}) => {
  const { dagData } = usePrerequisiteDAG(courseId);

  if (!dagData || dagData.nodes.length <= 1) return null;

  // Calculate completion statistics
  const prerequisites = dagData.nodes.filter(
    (node) => node.data.courseId !== courseId
  );
  const completedCount = prerequisites.filter((node) =>
    completedCourses.includes(node.data.courseId)
  ).length;
  const inProgressCount = prerequisites.filter((node) =>
    inProgressCourses.includes(node.data.courseId)
  ).length;
  const totalCount = prerequisites.length;

  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-red-50 to-white rounded-lg p-6 shadow-sm">
      <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-red-600" />
        Your Progress
      </h3>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Prerequisites Completed</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-red-500 to-red-600"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-2xl font-bold text-green-600">
              {completedCount}
            </p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">
              {inProgressCount}
            </p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-2xl font-bold text-gray-600">
              {totalCount - completedCount - inProgressCount}
            </p>
            <p className="text-xs text-gray-600">Remaining</p>
          </div>
        </div>

        {/* Eligibility Status */}
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            completionPercentage === 100
              ? "bg-green-50 text-green-800"
              : "bg-yellow-50 text-yellow-800"
          }`}
        >
          {completionPercentage === 100 ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                All prerequisites completed! You&apos;re eligible to enroll.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Complete {totalCount - completedCount} more prerequisite
                {totalCount - completedCount !== 1 ? "s" : ""} to be eligible.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Example usage in a main component
export const CourseSearchAIExample = () => {
  const [selectedCourse, setSelectedCourse] =
    React.useState<CourseWithRequirements>({
      course_id: 12345,
      course_code: "CS 225",
      title: "Data Structures",
      pre_requisites:
        "CS 125 or equivalent programming experience. Students should be comfortable with basic programming concepts.",
    });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Course Search AI</h1>

      {/* Course Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select a Course
        </label>
        <select
          value={selectedCourse.course_id}
          onChange={(e) => {
            const courseId = parseInt(e.target.value);
            setSelectedCourse({
              course_id: courseId,
              course_code: courseId === 12345 ? "CS 225" : "CS 374",
              title:
                courseId === 12345
                  ? "Data Structures"
                  : "Algorithms & Models of Computation",
              pre_requisites:
                courseId === 12345
                  ? "CS 125 or equivalent programming experience."
                  : "CS 225 and CS 173 or equivalent.",
            });
          }}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value={12345}>CS 225 - Data Structures</option>
          <option value={67890}>CS 374 - Algorithms</option>
        </select>
      </div>

      {/* Prerequisites Tab Content */}
      <PrerequisitesTabContent selectedCourse={selectedCourse} />
    </div>
  );
};
