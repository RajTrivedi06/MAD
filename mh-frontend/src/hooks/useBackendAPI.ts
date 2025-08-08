import { useState } from "react";
import { getCurrentUser } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

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

// Shared types for interest recommendations
export type RecResponse = {
  course_id: number;
  course_code?: string | null;
  catalog_number?: string | null;
  title?: string | null;
  similarity?: number | null;
};

type InterestPayload = {
  interest_text: string;
  top_k?: number;
};

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

  // ---------- Unified interest-based recommendation helper ----------
  const recommendByInterest = async (
    payload: InterestPayload
  ): Promise<RecResponse[]> => {
    const { data: sessionRes } = await supabase.auth.getSession();
    const token = sessionRes.session?.access_token;

    console.log("[recommendByInterest] →", {
      route: "/api/recommend/interest",
      hasToken: !!token,
      tokenPreview: token ? token.slice(0, 15) + "..." : null,
      body: {
        interest_text: payload.interest_text,
        top_k: payload.top_k ?? 10,
      },
      ts: new Date().toISOString(),
    });

    const res = await fetch(`${BACKEND_URL}/api/recommend/interest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        interest_text: payload.interest_text,
        top_k: payload.top_k ?? 10,
      }),
      credentials: "include",
    });

    console.log("[recommendByInterest] ←", {
      status: res.status,
      ok: res.ok,
      ts: new Date().toISOString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[recommendByInterest] ERROR payload:", text);
      throw new Error(text || `HTTP ${res.status}`);
    }

    // 👇 Add these lines
    const json = (await res.json()) as RecResponse[];
    console.log("[recommendByInterest] parsed:", {
      count: json?.length ?? 0,
      sample: json?.[0],
    });
    return json;
  };

  const uploadDarsFile = async (
    file: File
  ): Promise<{ success: boolean; data?: DarsData; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      updateProgress("uploading", "Uploading DARS file...", 10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      updateProgress("processing", "Processing DARS data...", 30);

      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;

      console.log("[uploadDarsFile] →", {
        route: "/api/dars/parse",
        hasToken: !!token,
        tokenPreview: token ? token.slice(0, 15) + "..." : null,
        ts: new Date().toISOString(),
      });

      const response = await fetch(`${BACKEND_URL}/api/dars/parse`, {
        method: "POST",
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log("[uploadDarsFile] ←", {
        route: "/api/dars/parse",
        status: response.status,
        hadAuthHeader: !!token,
        ts: new Date().toISOString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      updateProgress("storing", "Storing in profile...", 70);

      console.log("[uploadDarsFile] profile →", {
        route: `/api/dars/profile/${user.id}`,
        hasToken: !!token,
        ts: new Date().toISOString(),
      });

      const profRes = await fetch(
        `${BACKEND_URL}/api/dars/profile/${user.id}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      console.log("[uploadDarsFile] profile ←", {
        route: `/api/dars/profile/${user.id}`,
        status: profRes.status,
        ts: new Date().toISOString(),
      });

      let darsData: DarsData | undefined = undefined;
      if (profRes.ok) {
        const profJson = await profRes.json();
        darsData = profJson?.dars_data as DarsData | undefined;
      }

      updateProgress("complete", "DARS processing complete!", 100);

      return {
        success: true,
        data: darsData,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      updateProgress("error", errorMessage, 0);
      return { success: false, error: errorMessage };
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

      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      updateProgress("uploading", "Uploading CV file...", 10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      updateProgress("processing", "Processing CV with AI...", 30);

      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;

      console.log("[uploadCVFile] →", {
        route: "/api/cv/parse",
        hasToken: !!token,
        tokenPreview: token ? token.slice(0, 15) + "..." : null,
        ts: new Date().toISOString(),
      });

      const response = await fetch(`${BACKEND_URL}/api/cv/parse`, {
        method: "POST",
        body: formData,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log("[uploadCVFile] ←", {
        route: "/api/cv/parse",
        status: response.status,
        hadAuthHeader: !!token,
        ts: new Date().toISOString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      updateProgress("storing", "Storing in profile...", 70);

      console.log("[uploadCVFile] profile →", {
        route: `/api/cv/profile/${user.id}`,
        hasToken: !!token,
        ts: new Date().toISOString(),
      });

      const profRes = await fetch(`${BACKEND_URL}/api/cv/profile/${user.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log("[uploadCVFile] profile ←", {
        route: `/api/cv/profile/${user.id}`,
        status: profRes.status,
        ts: new Date().toISOString(),
      });

      let cvData: CVData | undefined = undefined;
      if (profRes.ok) {
        const profJson = await profRes.json();
        cvData = profJson?.cv_data as CVData | undefined;
      }

      updateProgress("complete", "CV processing complete!", 100);

      return {
        success: true,
        data: cvData,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      updateProgress("error", errorMessage, 0);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDarsData = async (): Promise<DarsData | null> => {
    try {
      const user = await getCurrentUser();
      if (!user) return null;

      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;

      console.log("[getUserDarsData] →", {
        route: `/api/dars/profile/${user.id}`,
        hasToken: !!token,
        ts: new Date().toISOString(),
      });

      const response = await fetch(
        `${BACKEND_URL}/api/dars/profile/${user.id}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      console.log("[getUserDarsData] ←", {
        route: `/api/dars/profile/${user.id}`,
        status: response.status,
        ts: new Date().toISOString(),
      });

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

      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;

      console.log("[getUserCVData] →", {
        route: `/api/cv/profile/${user.id}`,
        hasToken: !!token,
        ts: new Date().toISOString(),
      });

      const response = await fetch(`${BACKEND_URL}/api/cv/profile/${user.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log("[getUserCVData] ←", {
        route: `/api/cv/profile/${user.id}`,
        status: response.status,
        ts: new Date().toISOString(),
      });

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
      const response = await fetch(`${BACKEND_URL}/api/dars/health`);
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
    uploadDarsFile,
    uploadCVFile,
    getUserDarsData,
    getUserCVData,
    checkBackendHealth,
    resetUploadState,
    recommendByInterest,
    uploadProgress,
    isLoading,
    error,
  };
}
