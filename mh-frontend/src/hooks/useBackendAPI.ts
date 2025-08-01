// hooks/useBackendAPI.ts
import { useState } from "react";
import { getCurrentUser } from "@/lib/supabase/auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface UploadProgress {
  stage: "uploading" | "processing" | "storing" | "complete" | "error";
  message: string;
  progress: number;
}

export interface DarsData {
  student_info: {
    name: string;
    student_id: string;
    program_code: string;
    catalog_year?: string;
  };
  academic_progress: {
    total_credits_earned: number;
    total_credits_in_progress: number;
    current_gpa: number;
    completion_status: string;
  };
  courses: Array<{
    term: string;
    subject: string;
    number: string;
    credits: number;
    grade: string;
    title: string;
    is_passing: boolean;
  }>;
  requirements: Array<{
    name: string;
    status: string;
    credits_needed: number;
    credits_earned: number;
    credits_remaining: number;
    completion_percentage: number;
  }>;
}

export interface CVData {
  personal_info: {
    name: string;
    professional_title?: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    field_of_study?: string;
    graduation_year?: string;
    gpa?: string;
    relevant_coursework?: string[];
    honors?: string[];
  }>;
  experience: Array<{
    job_title: string;
    company: string;
    location?: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    description: string;
    key_achievements?: string[];
    technologies_used?: string[];
  }>;
  skills: {
    technical_skills?: string[];
    programming_languages?: string[];
    frameworks_tools?: string[];
    soft_skills?: string[];
    languages?: Array<{
      language: string;
      proficiency: string;
    }>;
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    duration?: string;
    key_features?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
    expiry_date?: string;
  }>;
}

export function useBackendAPI() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = (
    stage: UploadProgress["stage"],
    message: string,
    progress: number
  ) => {
    setUploadProgress({ stage, message, progress });
  };

  const uploadDarsFile = async (
    file: File
  ): Promise<{ success: boolean; data?: DarsData; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      updateProgress("uploading", "Uploading DARS file...", 10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      updateProgress("processing", "Processing DARS data...", 30);

      const response = await fetch(`${BACKEND_URL}/api/dars/parse`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      updateProgress("storing", "Storing in profile...", 70);

      const result = await response.json();

      updateProgress("complete", "DARS processing complete!", 100);

      return {
        success: true,
        data: result.dars_data,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      updateProgress("error", errorMessage, 0);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const uploadCVFile = async (
    file: File
  ): Promise<{ success: boolean; data?: CVData; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      updateProgress("uploading", "Uploading CV file...", 10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      updateProgress("processing", "Processing CV with AI...", 30);

      const response = await fetch(`${BACKEND_URL}/api/cv/parse`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      updateProgress("storing", "Storing in profile...", 70);

      const result = await response.json();

      updateProgress("complete", "CV processing complete!", 100);

      return {
        success: true,
        data: result.structured_data,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      updateProgress("error", errorMessage, 0);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDarsData = async (): Promise<DarsData | null> => {
    try {
      const user = await getCurrentUser();
      if (!user) return null;

      const response = await fetch(
        `${BACKEND_URL}/api/dars/profile/${user.id}`
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch DARS data");
      }

      const result = await response.json();
      return result.dars_data;
    } catch (err) {
      console.error("Error fetching DARS data:", err);
      return null;
    }
  };

  const getUserCVData = async (): Promise<CVData | null> => {
    try {
      const user = await getCurrentUser();
      if (!user) return null;

      const response = await fetch(`${BACKEND_URL}/api/cv/profile/${user.id}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch CV data");
      }

      const result = await response.json();
      return result.cv_data;
    } catch (err) {
      console.error("Error fetching CV data:", err);
      return null;
    }
  };

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const resetUploadState = () => {
    setUploadProgress(null);
    setIsLoading(false);
    setError(null);
  };

  return {
    // Upload functions
    uploadDarsFile,
    uploadCVFile,

    // Data retrieval
    getUserDarsData,
    getUserCVData,

    // Utility functions
    checkBackendHealth,
    resetUploadState,

    // State
    uploadProgress,
    isLoading,
    error,
  };
}
