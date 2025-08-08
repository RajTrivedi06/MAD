import React, { useState, useEffect } from "react";
import { ReactFlowPrerequisiteGraph } from "@/components/ReactFlowPrerequisiteGraph";
import { getCoursesWithPrerequisites } from "@/services/prerequisiteService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Sparkles,
  Database,
  Bug,
  AlertTriangle,
} from "lucide-react";

export default function TestReactFlow() {
  const [courseId, setCourseId] = useState<number>(356); // Default course ID for testing
  const [availableCourseIds, setAvailableCourseIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(true);
  const [completedCourses, setCompletedCourses] = useState<number[]>([
    100, 200,
  ]);
  const [inProgressCourses, setInProgressCourses] = useState<number[]>([300]);

  useEffect(() => {
    async function loadAvailableCourses() {
      try {
        const courses = await getCoursesWithPrerequisites();
        setAvailableCourseIds(courses);
        if (courses.length > 0 && !courses.includes(courseId)) {
          setCourseId(courses[0]);
        }
      } catch (error) {
        console.error("Error loading available courses:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAvailableCourses();
  }, [courseId]);

  const addCompletedCourse = (id: number) => {
    if (!completedCourses.includes(id)) {
      setCompletedCourses([...completedCourses, id]);
    }
  };

  const removeCompletedCourse = (id: number) => {
    setCompletedCourses(completedCourses.filter((c) => c !== id));
  };

  const addInProgressCourse = (id: number) => {
    if (!inProgressCourses.includes(id)) {
      setInProgressCourses([...inProgressCourses, id]);
    }
  };

  const removeInProgressCourse = (id: number) => {
    setInProgressCourses(inProgressCourses.filter((c) => c !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced React Flow Prerequisite Graph Test
          </h1>
          <p className="text-gray-600">
            Testing the new &quot;Ask user first&quot; functionality with
            detailed error handling
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Test Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course ID:
                  </label>
                  <input
                    type="number"
                    value={courseId}
                    onChange={(e) => setCourseId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter course ID"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCourseId(356)}
                    variant="outline"
                    size="sm"
                  >
                    Reset to 356
                  </Button>
                  <Button
                    onClick={() => setShowPrompt(!showPrompt)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {showPrompt ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showPrompt ? "Hide Prompt" : "Show Prompt"}
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available course IDs:
                  </label>
                  {loading ? (
                    <p className="text-gray-500">
                      Loading available courses...
                    </p>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {availableCourseIds.slice(0, 10).map((id: number) => (
                        <button
                          key={id}
                          onClick={() => setCourseId(id)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                        >
                          {id}
                        </button>
                      ))}
                      {availableCourseIds.length > 10 && (
                        <span className="text-xs text-gray-500">
                          +{availableCourseIds.length - 10} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Course Progress Simulation
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completed Courses:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {completedCourses.map((id) => (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {id}
                        <button
                          onClick={() => removeCompletedCourse(id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      placeholder="Add course ID"
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const value = Number(e.currentTarget.value);
                          if (value) {
                            addCompletedCourse(value);
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    In Progress Courses:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {inProgressCourses.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {id}
                        <button
                          onClick={() => removeInProgressCourse(id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      placeholder="Add course ID"
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const value = Number(e.currentTarget.value);
                          if (value) {
                            addInProgressCourse(value);
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Debug Info
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Current Course ID:</strong> {courseId}
                </p>
                <p>
                  <strong>Show Prompt:</strong> {showPrompt ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Completed Courses:</strong> {completedCourses.length}
                </p>
                <p>
                  <strong>In Progress:</strong> {inProgressCourses.length}
                </p>
                <p>
                  <strong>Available Courses:</strong>{" "}
                  {availableCourseIds.length}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-orange-200 bg-orange-50">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Error Testing
              </h3>
              <div className="text-sm text-orange-800 space-y-2">
                <p>
                  <strong>Test Error Scenarios:</strong>
                </p>
                <ul className="space-y-1 ml-4">
                  <li>
                    • Try course ID 999999 (should show &quot;Not Found&quot;
                    error)
                  </li>
                  <li>
                    • Disconnect internet (should show &quot;Network&quot;
                    error)
                  </li>
                  <li>• Try course ID 0 (should show validation error)</li>
                </ul>
                <p className="text-xs text-orange-600 mt-3">
                  The component now shows detailed error information with
                  troubleshooting steps.
                </p>
              </div>
            </Card>
          </div>

          {/* Graph Display */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Prerequisite Graph for Course {courseId}
              </h2>
              <ReactFlowPrerequisiteGraph
                courseId={courseId}
                onNodeClick={(clickedCourseId) => {
                  console.log("Clicked course:", clickedCourseId);
                  setCourseId(clickedCourseId);
                }}
                showPrompt={showPrompt}
                completedCourses={completedCourses}
                inProgressCourses={inProgressCourses}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
