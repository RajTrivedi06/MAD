import { useState, useEffect } from "react";
import { LabMatch } from "../types/labMatch";

const SAVED_LABS_KEY = "ra-finder-saved-labs";

export function useSavedLabs() {
  const [savedLabIds, setSavedLabIds] = useState<Set<string>>(new Set());

  // Load saved labs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_LABS_KEY);
      if (saved) {
        setSavedLabIds(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error("Failed to load saved labs:", error);
    }
  }, []);

  // Save to localStorage whenever savedLabIds changes
  useEffect(() => {
    try {
      localStorage.setItem(
        SAVED_LABS_KEY,
        JSON.stringify(Array.from(savedLabIds))
      );
    } catch (error) {
      console.error("Failed to save labs:", error);
    }
  }, [savedLabIds]);

  const toggleSavedLab = (labId: string) => {
    setSavedLabIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(labId)) {
        newSet.delete(labId);
      } else {
        newSet.add(labId);
      }
      return newSet;
    });
  };

  const isLabSaved = (labId: string) => savedLabIds.has(labId);

  const getSavedLabs = (allLabs: LabMatch[]) => {
    return allLabs.filter((lab) => savedLabIds.has(lab.id));
  };

  const clearAllSaved = () => {
    setSavedLabIds(new Set());
  };

  return {
    savedLabIds: Array.from(savedLabIds),
    savedCount: savedLabIds.size,
    toggleSavedLab,
    isLabSaved,
    getSavedLabs,
    clearAllSaved,
  };
}
