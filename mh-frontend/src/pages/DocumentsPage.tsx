// pages/DocumentsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DocumentUpload from "@/components/DocumentUpload";
import { useBackendAPI, DarsData, CVData } from "@/hooks/useBackendAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentSummaryProps {
  darsData: DarsData | null;
  cvData: CVData | null;
  onRefresh: () => void;
}

const DocumentSummary: React.FC<DocumentSummaryProps> = ({
  darsData,
  cvData,
  onRefresh,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* DARS Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>DARS Report Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {darsData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Student Name
                  </p>
                  <p className="text-lg font-semibold">
                    {darsData.student_info.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Student ID
                  </p>
                  <p className="text-lg font-semibold">
                    {darsData.student_info.student_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Program</p>
                  <p className="text-lg font-semibold">
                    {darsData.student_info.program_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Current GPA
                  </p>
                  <p className="text-lg font-semibold">
                    {darsData.academic_progress.current_gpa}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Academic Progress
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Credits Earned:{" "}
                    {darsData.academic_progress.total_credits_earned}
                  </div>
                  <div>
                    Credits In Progress:{" "}
                    {darsData.academic_progress.total_credits_in_progress}
                  </div>
                </div>
                <div className="text-sm">
                  Status:{" "}
                  <span className="font-medium">
                    {darsData.academic_progress.completion_status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Courses & Requirements
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Courses: {darsData.courses.length}</div>
                  <div>Requirements: {darsData.requirements.length}</div>
                </div>
              </div>

              <button
                onClick={onRefresh}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh DARS Data
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📊</div>
              <p>No DARS report uploaded yet</p>
              <p className="text-sm mt-2">
                Upload your DARS report to see academic progress
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CV Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📝</span>
            <span>Resume/CV Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cvData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg font-semibold">
                    {cvData.personal_info.name}
                  </p>
                </div>
                {cvData.personal_info.professional_title && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Professional Title
                    </p>
                    <p className="text-lg font-semibold">
                      {cvData.personal_info.professional_title}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Education & Experience
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Education Entries: {cvData.education.length}</div>
                  <div>Work Experience: {cvData.experience.length}</div>
                </div>
                {cvData.projects && (
                  <div className="text-sm">
                    Projects: {cvData.projects.length}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Skills</p>
                <div className="space-y-1 text-sm">
                  {cvData.skills.technical_skills &&
                    cvData.skills.technical_skills.length > 0 && (
                      <div>
                        Technical Skills:{" "}
                        {cvData.skills.technical_skills.length}
                      </div>
                    )}
                  {cvData.skills.programming_languages &&
                    cvData.skills.programming_languages.length > 0 && (
                      <div>
                        Programming Languages:{" "}
                        {cvData.skills.programming_languages.length}
                      </div>
                    )}
                  {cvData.skills.frameworks_tools &&
                    cvData.skills.frameworks_tools.length > 0 && (
                      <div>
                        Frameworks & Tools:{" "}
                        {cvData.skills.frameworks_tools.length}
                      </div>
                    )}
                </div>
              </div>

              <button
                onClick={onRefresh}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Refresh CV Data
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">📝</div>
              <p>No resume/CV uploaded yet</p>
              <p className="text-sm mt-2">
                Upload your CV for AI-powered analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { getUserDarsData, getUserCVData, checkBackendHealth } =
    useBackendAPI();
  const [darsData, setDarsData] = useState<DarsData | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;

    try {
      const [dars, cv, health] = await Promise.all([
        getUserDarsData(),
        getUserCVData(),
        checkBackendHealth(),
      ]);

      setDarsData(dars);
      setCvData(cv);
      setBackendStatus(health);
    } catch (error) {
      console.error("Error loading data:", error);
      setBackendStatus(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUploadComplete = (
    type: "dars" | "cv",
    data: DarsData | CVData
  ) => {
    if (type === "dars") {
      setDarsData(data as DarsData);
      setUploadSuccess("DARS report uploaded and processed successfully!");
    } else {
      setCvData(data as CVData);
      setUploadSuccess("Resume/CV uploaded and processed successfully!");
    }

    setShowUpload(false);
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    // Error handling is managed by the DocumentUpload component
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Document Management
          </h1>
          <p className="text-gray-600">
            Please log in to manage your documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Document Management
          </h1>
          <p className="text-gray-600 mt-2">
            Upload and manage your DARS reports and resume/CV
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Backend Status Indicator */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                backendStatus ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              Backend {backendStatus ? "Connected" : "Disconnected"}
            </span>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {showUpload ? "Hide Upload" : "Upload Documents"}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {uploadSuccess}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backend Disconnected Warning */}
      {backendStatus === false && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Backend Disconnected
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  The backend API is not responding. Please ensure the backend
                  server is running on port 8000.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />
          </CardContent>
        </Card>
      )}

      {/* Document Summaries */}
      <DocumentSummary
        darsData={darsData}
        cvData={cvData}
        onRefresh={loadData}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowUpload(true)}
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📤</div>
              <h3 className="font-medium text-gray-900">Upload Documents</h3>
              <p className="text-sm text-gray-600">
                Add DARS reports or resume/CV
              </p>
            </button>

            <button
              onClick={loadData}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-medium text-gray-900">Refresh Data</h3>
              <p className="text-sm text-gray-600">
                Reload document information
              </p>
            </button>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-left">
              <div className="text-2xl mb-2">🔗</div>
              <h3 className="font-medium text-gray-900">Backend Testing</h3>
              <p className="text-sm text-gray-600">
                <a
                  href="http://localhost:8000/testing/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Open Testing Dashboard →
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsPage;
