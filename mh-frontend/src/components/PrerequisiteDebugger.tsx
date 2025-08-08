import React, { useState, useEffect } from "react";
import {
  debugPrerequisiteTable,
  validateReactFlowData,
  checkPrerequisiteDataExists,
  getCoursesWithPrerequisites,
} from "@/services/prerequisiteService";
import { useReactFlowPrerequisites } from "@/hooks/useReactFlowPrerequisites";

interface PrerequisiteDebuggerProps {
  courseId: number;
}

export const PrerequisiteDebugger: React.FC<PrerequisiteDebuggerProps> = ({
  courseId,
}) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [availableCourses, setAvailableCourses] = useState<number[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Use the same hook as your main component
  const { data, loading, error, fetchReactFlowData } =
    useReactFlowPrerequisites();

  const runFullDebug = async () => {
    setIsDebugging(true);
    console.log("=== FULL PREREQUISITE DEBUG STARTED ===");

    try {
      // 1. Check if course exists in prereq_dag table
      console.log("1. Checking if prerequisite data exists...");
      const dataExists = await checkPrerequisiteDataExists(courseId);

      // 2. Get raw database data
      console.log("2. Getting raw database data...");
      const rawData = await debugPrerequisiteTable(courseId);

      // 3. Get all courses with prerequisites
      console.log("3. Getting all courses with prerequisites...");
      const coursesWithPrereqs = await getCoursesWithPrerequisites();
      setAvailableCourses(coursesWithPrereqs);

      // 4. Validate ReactFlow data structure if it exists
      let validationResult = null;
      if (rawData.data && rawData.data[0]?.reactflow_dag_json) {
        console.log("4. Validating ReactFlow data structure...");
        const reactflowData =
          typeof rawData.data[0].reactflow_dag_json === "string"
            ? JSON.parse(rawData.data[0].reactflow_dag_json)
            : rawData.data[0].reactflow_dag_json;
        validationResult = validateReactFlowData(reactflowData);
      }

      // 5. Test the hook
      console.log("5. Testing useReactFlowPrerequisites hook...");
      await fetchReactFlowData(courseId);

      const debugResult = {
        courseId,
        dataExists,
        rawData,
        coursesWithPrereqs: coursesWithPrereqs.slice(0, 10), // Show first 10
        totalCoursesWithPrereqs: coursesWithPrereqs.length,
        validationResult,
        hookData: data,
        hookError: error,
        hookLoading: loading,
        timestamp: new Date().toISOString(),
      };

      setDebugInfo(debugResult);
      console.log("=== FULL DEBUG RESULT ===", debugResult);
    } catch (debugError) {
      console.error("Debug process failed:", debugError);
      setDebugInfo({ error: debugError.message });
    } finally {
      setIsDebugging(false);
    }
  };

  // Auto-run debug when component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      runFullDebug();
    }
  }, [courseId]);

  if (!expanded) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
        <div className="flex items-center justify-between">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Debug Mode:</strong> Prerequisite Graph Debugging Active
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Course ID: {courseId} | Available courses with prereqs:{" "}
                {availableCourses.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="text-yellow-800 hover:text-yellow-600 text-sm font-medium"
          >
            Show Debug Info
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-xs my-4 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-green-300 font-bold text-sm">
          🐛 PREREQUISITE DEBUG CONSOLE
        </h3>
        <div className="flex gap-2">
          <button
            onClick={runFullDebug}
            disabled={isDebugging}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
          >
            {isDebugging ? "Debugging..." : "Re-run Debug"}
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Collapse
          </button>
        </div>
      </div>

      {isDebugging && (
        <div className="text-yellow-400">
          <p>🔍 Running full debug analysis...</p>
          <div className="animate-pulse">Please wait...</div>
        </div>
      )}

      {debugInfo && (
        <div className="space-y-4">
          <div>
            <h4 className="text-blue-300 font-semibold">📊 SUMMARY</h4>
            <p>Course ID: {debugInfo.courseId}</p>
            <p>
              Data Exists in DB: {debugInfo.dataExists ? "✅ YES" : "❌ NO"}
            </p>
            <p>Hook Loading: {debugInfo.hookLoading ? "⏳ YES" : "✅ NO"}</p>
            <p>
              Hook Error:{" "}
              {debugInfo.hookError ? `❌ ${debugInfo.hookError}` : "✅ NONE"}
            </p>
            <p>Hook Data: {debugInfo.hookData ? "✅ LOADED" : "❌ NULL"}</p>
          </div>

          <div>
            <h4 className="text-blue-300 font-semibold">🗃️ DATABASE INFO</h4>
            <p>
              Total courses with prerequisites:{" "}
              {debugInfo.totalCoursesWithPrereqs}
            </p>
            <p>
              Sample courses:{" "}
              {debugInfo.coursesWithPrereqs?.join(", ") || "None"}
            </p>
            <p>
              Raw DB Query Success:{" "}
              {debugInfo.rawData?.error ? "❌ NO" : "✅ YES"}
            </p>
            {debugInfo.rawData?.error && (
              <p className="text-red-400">
                DB Error: {JSON.stringify(debugInfo.rawData.error)}
              </p>
            )}
          </div>

          {debugInfo.validationResult && (
            <div>
              <h4 className="text-blue-300 font-semibold">🔍 VALIDATION</h4>
              <p>
                ReactFlow Data Valid:{" "}
                {debugInfo.validationResult.valid ? "✅ YES" : "❌ NO"}
              </p>
              {debugInfo.validationResult.issues?.length > 0 && (
                <div>
                  <p className="text-red-400">Issues found:</p>
                  <ul className="ml-4">
                    {debugInfo.validationResult.issues.map(
                      (issue: string, i: number) => (
                        <li key={i} className="text-red-300">
                          • {issue}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {debugInfo.rawData?.data && (
            <div>
              <h4 className="text-blue-300 font-semibold">
                📄 RAW DATA SAMPLE
              </h4>
              <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(debugInfo.rawData.data[0], null, 2)}
              </pre>
            </div>
          )}

          {debugInfo.hookData && (
            <div>
              <h4 className="text-blue-300 font-semibold">🎣 HOOK DATA</h4>
              <pre className="bg-black p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(
                  {
                    course_id: debugInfo.hookData.course_id,
                    main_course: debugInfo.hookData.main_course,
                    nodes_count:
                      debugInfo.hookData.reactflow_data?.nodes?.length || 0,
                    edges_count:
                      debugInfo.hookData.reactflow_data?.edges?.length || 0,
                    conversion_status: debugInfo.hookData.conversion_status,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          <div className="text-xs text-gray-400">
            Debug completed at: {debugInfo.timestamp}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-600">
        <h4 className="text-blue-300 font-semibold">💡 TROUBLESHOOTING TIPS</h4>
        <ul className="text-xs space-y-1">
          <li>• Check if courseId {courseId} exists in prereq_dag table</li>
          <li>• Verify reactflow_dag_json column contains valid JSON</li>
          <li>• Ensure nodes array has courseId property in data</li>
          <li>• Check database connection and permissions</li>
          <li>• Try with a different course ID from available list</li>
        </ul>
      </div>
    </div>
  );
};
