import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useCredits() {
  const [credits, setCredits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("credits")
        .not("credits", "is", null)
        .order("credits");

      if (error) throw error;

      // Get unique credits
      const uniqueCredits = [
        ...new Set(
          data?.map((item) => item.credits).filter(Boolean) as string[]
        ),
      ];
      setCredits(uniqueCredits);
    } catch (err) {
      console.error("Error fetching credits:", err);
    } finally {
      setLoading(false);
    }
  };

  return { credits, loading };
}
