import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

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
        .not("college", "is", null)
        .order("college");

      if (error) throw error;

      // Get unique colleges
      const uniqueColleges = [
        ...new Set(
          data?.map((item) => item.college).filter(Boolean) as string[]
        ),
      ];
      setColleges(uniqueColleges);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    } finally {
      setLoading(false);
    }
  };

  return { colleges, loading };
}
