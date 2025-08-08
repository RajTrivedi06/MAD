import { useEffect, useState } from "react";
import { SectionsResponse } from "@/types/sections.types";
import { supabase } from "@/lib/supabase/client";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useSections(courseId: number | null) {
  const [data, setData] = useState<SectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!courseId) {
        setData(null);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const token = sessionRes.session?.access_token;
        console.log("[useSections] →", {
          courseId,
          hasToken: !!token,
          tokenPreview: token ? token.slice(0, 15) + "..." : null,
          ts: new Date().toISOString(),
        });
        const res = await fetch(
          `${BACKEND_URL}/api/course/${courseId}/sections`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        console.log("[useSections] ←", {
          courseId,
          status: res.status,
          hadAuthHeader: !!token,
          ts: new Date().toISOString(),
        });
        if (!res.ok) {
          const body = await res.text();
          console.warn("[useSections] error body", body.slice(0, 200));
          throw new Error(
            `Sections fetch failed (${res.status}): ${body || "Unknown error"}`
          );
        }
        const json = (await res.json()) as SectionsResponse;

        if (!isMounted) return;

        setData(json);
      } catch (e: unknown) {
        if (!isMounted) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Lazy load only when needed (when tab is opened we’ll call refetch from UI if you’d like)
    run();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  return { data, loading, error };
}
