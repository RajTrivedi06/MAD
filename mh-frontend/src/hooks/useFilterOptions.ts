import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

// Hook for fetching course codes (subjects)
export function useCourseSubjects() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      // Get distinct course codes and extract the subject prefix
      const { data, error } = await supabase
        .from("courses")
        .select("course_code")
        .not("course_code", "is", null);

      if (error) throw error;

      // Extract unique subject prefixes (e.g., "COMP SCI" from "COMP SCI 300")
      const subjectSet = new Set<string>();
      data?.forEach((item) => {
        if (item.course_code) {
          // Extract everything before the last space and number
          const match = item.course_code.match(/^(.+?)\s+\d+$/);
          if (match) {
            subjectSet.add(match[1]);
          }
        }
      });

      const uniqueSubjects = Array.from(subjectSet).sort();
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  return { subjects, loading };
}

// Hook for fetching terms from last_taught_term
export function useTerms() {
  const [terms, setTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      // Only return Fall 2025 for the term filter
      setTerms(["Fall 2025"]);
    } catch (err) {
      console.error("Error fetching terms:", err);
    } finally {
      setLoading(false);
    }
  };

  return { terms, loading };
}

// Hook for fetching colleges
export function useColleges() {
  const [colleges, setColleges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("college")
        .not("college", "is", null);

      if (error) throw error;

      const uniqueColleges = [
        ...new Set(
          data?.map((item) => item.college).filter(Boolean) as string[]
        ),
      ].sort();

      setColleges(uniqueColleges);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    } finally {
      setLoading(false);
    }
  };

  return { colleges, loading };
}

// Hook for fetching breadth requirements
export function useBreadthRequirements() {
  const [breadthRequirements, setBreadthRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreadthRequirements();
  }, []);

  const fetchBreadthRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from("course_requirements")
        .select("breadth_or")
        .not("breadth_or", "is", null);

      if (error) throw error;

      // Flatten and get unique breadth requirements
      const allBreadth = data?.flatMap((item) => item.breadth_or || []) || [];
      const uniqueBreadth = [...new Set(allBreadth)].filter(Boolean).sort();

      setBreadthRequirements(uniqueBreadth);
    } catch (err) {
      console.error("Error fetching breadth requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  return { breadthRequirements, loading };
}

// Hook for fetching general education requirements
export function useGeneralEducationRequirements() {
  const [genEdRequirements, setGenEdRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenEdRequirements();
  }, []);

  const fetchGenEdRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from("course_requirements")
        .select("gened_and")
        .not("gened_and", "is", null);

      if (error) throw error;

      // Flatten and get unique gen ed requirements
      const allGenEd = data?.flatMap((item) => item.gened_and || []) || [];
      const uniqueGenEd = [...new Set(allGenEd)].filter(Boolean).sort();

      setGenEdRequirements(uniqueGenEd);
    } catch (err) {
      console.error("Error fetching general education requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  return { genEdRequirements, loading };
}

// Hook for fetching levels
export function useLevels() {
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("level")
        .not("level", "is", null);

      if (error) throw error;

      const uniqueLevels = [
        ...new Set(data?.map((item) => item.level).filter(Boolean) as string[]),
      ].sort();

      setLevels(uniqueLevels);
    } catch (err) {
      console.error("Error fetching levels:", err);
    } finally {
      setLoading(false);
    }
  };

  return { levels, loading };
}

// Hook for fetching CLO audiences
export function useCLOAudiences() {
  const [audiences, setAudiences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudiences();
  }, []);

  const fetchAudiences = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("clo_audience")
        .not("clo_audience", "is", null);

      if (error) throw error;

      const uniqueAudiences = [
        ...new Set(
          data?.map((item) => item.clo_audience).filter(Boolean) as string[]
        ),
      ].sort();

      setAudiences(uniqueAudiences);
    } catch (err) {
      console.error("Error fetching CLO audiences:", err);
    } finally {
      setLoading(false);
    }
  };

  return { audiences, loading };
}
