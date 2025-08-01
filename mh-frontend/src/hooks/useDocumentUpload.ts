// src/hooks/useDocumentUpload.ts
"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";

export type DocumentType = "dars" | "cv";

interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadedData: Record<string, unknown> | null;
}

export type DocumentStatus = {
  darsStatus: "not_uploaded" | "processing" | "completed";
  cvStatus: "not_uploaded" | "processing" | "completed";
  lastUpdated: {
    dars: Date | null;
    cv: Date | null;
  };
};

export function useDocumentUpload() {
  const [darsState, setDarsState] = useState<UploadState>({
    isUploading: false,
    uploadProgress: 0,
    error: null,
    uploadedData: null,
  });

  const [cvState, setCvState] = useState<UploadState>({
    isUploading: false,
    uploadProgress: 0,
    error: null,
    uploadedData: null,
  });

  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>({
    darsStatus: "not_uploaded",
    cvStatus: "not_uploaded",
    lastUpdated: {
      dars: null,
      cv: null,
    },
  });

  const updateProgress = useCallback((type: DocumentType, progress: number) => {
    const setter = type === "dars" ? setDarsState : setCvState;
    setter((prev) => ({ ...prev, uploadProgress: progress }));
  }, []);

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "Please upload a PDF file only.";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB.";
    }
    return null;
  };

  const uploadDocument = async (
    file: File,
    type: DocumentType
  ): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> => {
    const validationError = validateFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const setter = type === "dars" ? setDarsState : setCvState;
    setter({
      isUploading: true,
      uploadProgress: 0,
      error: null,
      uploadedData: null,
    });

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      updateProgress(type, 10); // Uploading

      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      const endpoint = type === "dars" ? "/api/dars/parse" : "/api/cv/parse";
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      updateProgress(type, 50); // Processing

      const data = await response.json();

      updateProgress(type, 100); // Complete

      setter({
        isUploading: false,
        uploadProgress: 100,
        error: null,
        uploadedData: data,
      });

      // Update status
      setDocumentStatus((prev) => ({
        ...prev,
        [`${type}Status`]: "completed",
        lastUpdated: {
          ...prev.lastUpdated,
          [type]: new Date(),
        },
      }));

      // Add a small delay to ensure database write completes
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh document status
      await getDocumentStatus();

      // Force profile refresh if available
      if (
        typeof window !== "undefined" &&
        window.location.pathname === "/accounts"
      ) {
        // Trigger a profile reload
        window.dispatchEvent(new Event("profile-updated"));
      }

      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setter({
        isUploading: false,
        uploadProgress: 0,
        error: errorMsg,
        uploadedData: null,
      });
      return { success: false, error: errorMsg };
    }
  };

  const getDocumentStatus = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("processing_status, updated_at, dars_data, cv_data")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching document status:", error);
      return;
    }

    setDocumentStatus({
      darsStatus: data.processing_status?.dars || "not_uploaded",
      cvStatus: data.processing_status?.cv || "not_uploaded",
      lastUpdated: {
        dars: data.dars_data ? new Date(data.updated_at) : null,
        cv: data.cv_data ? new Date(data.updated_at) : null,
      },
    });

    setDarsState((prev) => ({ ...prev, uploadedData: data.dars_data }));
    setCvState((prev) => ({ ...prev, uploadedData: data.cv_data }));
  }, []);

  return {
    darsState,
    cvState,
    documentStatus,
    uploadDocument,
    getDocumentStatus,
  };
}
