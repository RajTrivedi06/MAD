import { useState, useEffect } from "react";
import { ApplicationStatus } from "../types/labMatch";

const APPLICATION_STATUS_KEY = "ra-finder-application-status";

export function useApplicationTracker() {
  const [applicationStatuses, setApplicationStatuses] = useState<
    Record<string, ApplicationStatus>
  >({});

  // Load application statuses from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(APPLICATION_STATUS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach((labId) => {
          const status = parsed[labId];
          if (
            status &&
            typeof status === "object" &&
            "appliedDate" in status &&
            typeof status.appliedDate === "string"
          ) {
            status.appliedDate = new Date(status.appliedDate);
          }
        });
        setApplicationStatuses(parsed);
      }
    } catch (error) {
      console.error("Failed to load application statuses:", error);
    }
  }, []);

  // Save to localStorage whenever applicationStatuses changes
  useEffect(() => {
    try {
      localStorage.setItem(
        APPLICATION_STATUS_KEY,
        JSON.stringify(applicationStatuses)
      );
    } catch (error) {
      console.error("Failed to save application statuses:", error);
    }
  }, [applicationStatuses]);

  const markAsApplied = (labId: string, notes?: string) => {
    setApplicationStatuses((prev) => ({
      ...prev,
      [labId]: {
        applied: true,
        appliedDate: new Date(),
        responseReceived: false,
        notes,
      },
    }));
  };

  const markResponseReceived = (labId: string, notes?: string) => {
    setApplicationStatuses((prev) => ({
      ...prev,
      [labId]: {
        ...prev[labId],
        responseReceived: true,
        notes: notes || prev[labId]?.notes,
      },
    }));
  };

  const updateNotes = (labId: string, notes: string) => {
    setApplicationStatuses((prev) => ({
      ...prev,
      [labId]: {
        ...prev[labId],
        notes,
      },
    }));
  };

  const removeApplication = (labId: string) => {
    setApplicationStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[labId];
      return newStatuses;
    });
  };

  const getApplicationStatus = (labId: string): ApplicationStatus => {
    return applicationStatuses[labId] || { applied: false };
  };

  const getAppliedCount = () => {
    return Object.values(applicationStatuses).filter((status) => status.applied)
      .length;
  };

  const getResponseCount = () => {
    return Object.values(applicationStatuses).filter(
      (status) => status.responseReceived
    ).length;
  };

  return {
    applicationStatuses,
    markAsApplied,
    markResponseReceived,
    updateNotes,
    removeApplication,
    getApplicationStatus,
    getAppliedCount,
    getResponseCount,
  };
}
