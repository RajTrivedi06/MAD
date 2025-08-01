// components/DocumentUpload.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  useBackendAPI,
  UploadProgress,
  DarsData,
  CVData,
} from "@/hooks/useBackendAPI";

type DocumentType = "dars" | "cv";

interface DocumentUploadProps {
  onUploadComplete?: (type: DocumentType, data: DarsData | CVData) => void;
  onError?: (error: string) => void;
}

interface ProgressBarProps {
  progress: UploadProgress;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const getStageColor = (stage: UploadProgress["stage"]) => {
    switch (stage) {
      case "uploading":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "storing":
        return "bg-purple-500";
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStageIcon = (stage: UploadProgress["stage"]) => {
    switch (stage) {
      case "uploading":
        return "📤";
      case "processing":
        return "⚙️";
      case "storing":
        return "💾";
      case "complete":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          {getStageIcon(progress.stage)} {progress.message}
        </span>
        <span className="text-sm text-gray-500">{progress.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${getStageColor(
            progress.stage
          )}`}
          style={{ width: `${progress.progress}%` }}
        ></div>
      </div>
    </div>
  );
};

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<DocumentType>("dars");
  const {
    uploadDarsFile,
    uploadCVFile,
    uploadProgress,
    isLoading,
    error,
    resetUploadState,
  } = useBackendAPI();

  const handleUpload = async (files: File[], type: DocumentType) => {
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      const errorMsg = "Please upload a PDF file only.";
      onError?.(errorMsg);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = "File size must be less than 10MB.";
      onError?.(errorMsg);
      return;
    }

    resetUploadState();

    try {
      let result;
      if (type === "dars") {
        result = await uploadDarsFile(file);
      } else {
        result = await uploadCVFile(file);
      }

      if (result.success && result.data) {
        onUploadComplete?.(type, result.data);
      } else {
        onError?.(result.error || "Upload failed");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unexpected error occurred";
      onError?.(errorMsg);
    }
  };

  const DarsDropzone = () => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      handleUpload(acceptedFiles, "dars");
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
      disabled: isLoading,
    });

    return (
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          }
          ${
            isLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-blue-400 hover:bg-blue-50"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-6xl">📊</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload your DARS Report
            </h3>
            <p className="text-gray-600">
              {isDragActive
                ? "Drop your DARS PDF here..."
                : "Click here or drag and drop your DARS PDF file"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports PDF files up to 10MB
            </p>
          </div>
          {!isLoading && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Choose DARS File
            </button>
          )}
        </div>
      </div>
    );
  };

  const CVDropzone = () => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      handleUpload(acceptedFiles, "cv");
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
      disabled: isLoading,
    });

    return (
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-gray-50"
          }
          ${
            isLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-green-400 hover:bg-green-50"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-6xl">📝</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload your Resume/CV
            </h3>
            <p className="text-gray-600">
              {isDragActive
                ? "Drop your CV PDF here..."
                : "Click here or drag and drop your CV/Resume PDF file"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports PDF files up to 10MB • AI-powered parsing
            </p>
          </div>
          {!isLoading && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Choose CV File
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("dars")}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === "dars"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📊 DARS Report
        </button>
        <button
          onClick={() => setActiveTab("cv")}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === "cv"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📝 Resume/CV
        </button>
      </div>

      {/* Upload Area */}
      <div className="space-y-6">
        {activeTab === "dars" ? <DarsDropzone /> : <CVDropzone />}

        {/* Progress Bar */}
        {uploadProgress && <ProgressBar progress={uploadProgress} />}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Upload Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              📊 DARS Reports
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Academic progress tracking</li>
              <li>• Course requirement analysis</li>
              <li>• GPA and credit calculations</li>
              <li>• Degree completion status</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">📝 Resume/CV</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• AI-powered data extraction</li>
              <li>• Skills and experience parsing</li>
              <li>• Education background analysis</li>
              <li>• Research opportunity matching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
