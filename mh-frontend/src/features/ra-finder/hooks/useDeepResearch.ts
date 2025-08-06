import { useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { LabMatch } from "../types/labMatch";
import { useLabValidation } from "./useLabValidation";

interface ClarifyingQuestion {
  question: string;
  context: string;
}

interface DeepResearchOptions {
  onProgress?: (message: string) => void;
}

interface UseDeepResearchReturn {
  searchWithAI: (
    interestStatement?: string,
    clarificationAnswers?: Record<string, string>
  ) => Promise<DeepResearchResult | undefined>;
  loading: boolean;
  error: string | null;
  results: LabMatch[];
  clarifyingQuestions: ClarifyingQuestion[];
  searchMetadata: Record<string, unknown> | null;
  modelUsed: string | null;
  isAdvancedModelUnavailable: boolean;
  fallbackReason: string | null;
  validationSummary: {
    total: number;
    valid: number;
    invalid: number;
    validationRate: number;
  } | null;
  hasUnverifiedData: boolean;
  resetSearch: () => void;
}

interface DeepResearchResult {
  labs?: LabMatch[];
  needsClarification?: boolean;
  questions?: ClarifyingQuestion[];
  searchMetadata?: Record<string, unknown>;
}

export function useDeepResearch(
  options?: DeepResearchOptions
): UseDeepResearchReturn {
  const { profile } = useProfile();
  const { validateAndFilterLabs, getValidationSummary, isDataAuthentic } =
    useLabValidation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LabMatch[]>([]);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<
    ClarifyingQuestion[]
  >([]);
  const [searchMetadata, setSearchMetadata] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isAdvancedModelUnavailable, setIsAdvancedModelUnavailable] =
    useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
    validationRate: number;
  } | null>(null);
  const [hasUnverifiedData, setHasUnverifiedData] = useState<boolean>(false);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:8000";

  // 📣 Log once so you can verify the env var
  console.log("[useDeepResearch] BACKEND_URL =", BACKEND_URL);

  const searchWithAI = useCallback(
    async (
      interestStatement?: string,
      clarificationAnswers?: Record<string, string>
    ): Promise<DeepResearchResult | undefined> => {
      if (!profile?.id) {
        setError("Please log in to use AI recommendations");
        return;
      }

      setLoading(true);
      setError(null);
      options?.onProgress?.("Starting deep research…");

      try {
        // 1️⃣ Ensure profile summary exists
        if (!profile.profile_summary) {
          options?.onProgress?.("Generating your profile summary...");
          const summaryRes = await fetch(
            `${BACKEND_URL}/api/profile/summarize`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: profile.id,
                force_regenerate: false,
              }),
            }
          );
          if (!summaryRes.ok) {
            const err = await summaryRes.json();
            throw new Error(err.detail || "Failed to generate profile summary");
          }
          options?.onProgress?.("Profile summary queued for generation");
        }

        // 2️⃣ Call deep‐research endpoint
        options?.onProgress?.("Searching for matching research labs...");
        const payload = {
          user_id: profile.id, // must be a real UUID from your DB
          interest_statement: interestStatement,
          clarification_answers: clarificationAnswers,
          max_results: 12,
        };
        console.log("[useDeepResearch] payload →", payload);

        const res = await fetch(`${BACKEND_URL}/api/ra/deep-research`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("[useDeepResearch] raw status/code →", res.status);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Search failed");
        }

        const data = await res.json();
        console.log("[useDeepResearch] response JSON →", data);

        // 3️⃣ Handle clarifications
        if (data.needs_clarification && data.clarifying_questions) {
          setClarifyingQuestions(data.clarifying_questions);
          setLoading(false);
          return {
            needsClarification: true,
            questions: data.clarifying_questions,
          };
        }

        // 4️⃣ Handle actual lab results
        if (Array.isArray(data.labs)) {
          // Validate and filter labs
          const validLabs = validateAndFilterLabs(data.labs);
          const summary = getValidationSummary(data.labs);
          const isAuthentic = isDataAuthentic(data.labs);

          console.log("Lab validation summary:", summary);
          console.log("Data authenticity:", isAuthentic);

          // Set validation state
          setValidationSummary(summary);
          setHasUnverifiedData(!isAuthentic);

          // Set validated results
          setResults(validLabs);
          setSearchMetadata(data.search_metadata);

          // Extract model information and fallback status
          const model = data.search_metadata?.model_used as string;
          const modelStatus = data.search_metadata?.model_status as string;
          const fallbackReason = data.search_metadata
            ?.fallback_reason as string;
          const o3Available = data.search_metadata
            ?.o3_deep_research_available as boolean;

          setModelUsed(model);
          setIsAdvancedModelUnavailable(modelStatus === "fallback_used");
          setFallbackReason(fallbackReason);

          const name = getModelDisplayName(model);

          // Log validation results
          if (validLabs.length < data.labs.length) {
            const filteredCount = data.labs.length - validLabs.length;
            console.warn(`Filtered out ${filteredCount} potentially fake labs`);
            options?.onProgress?.(
              `Filtered out ${filteredCount} potentially fake labs. Showing ${validLabs.length} verified labs.`
            );
          }

          if (validLabs.length === 0 && data.labs.length > 0) {
            console.error(
              "All labs failed validation - likely receiving fake data"
            );
            options?.onProgress?.(
              "Warning: All labs failed authenticity validation. Please try again."
            );
          }

          // Update progress message with warnings if fallback was used
          if (modelStatus === "fallback_used") {
            options?.onProgress?.(
              `⚠️ o4-mini-deep-research unavailable. Found ${validLabs.length} verified labs using ${name} fallback.`
            );
          } else {
            options?.onProgress?.(
              `Found ${validLabs.length} verified labs using ${name}!`
            );
          }

          return {
            labs: validLabs,
            searchMetadata: data.search_metadata,
          };
        }

        throw new Error("No labs returned");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Search failed";
        setError(msg);
        options?.onProgress?.(`Error: ${msg}`);
        console.error("[useDeepResearch] error →", err);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [profile, options, BACKEND_URL]
  );

  const resetSearch = useCallback(() => {
    setResults([]);
    setClarifyingQuestions([]);
    setSearchMetadata(null);
    setModelUsed(null);
    setIsAdvancedModelUnavailable(false);
    setFallbackReason(null);
    setError(null);
    setValidationSummary(null);
    setHasUnverifiedData(false);
  }, []);

  const getModelDisplayName = (model: string | undefined): string => {
    if (!model) return "AI";
    switch (model) {
      case "o4-mini-deep-research":
        return "OpenAI o4-mini-deep-research (Advanced)";
      case "gpt-4o":
        return "OpenAI GPT-4o";
      case "fallback-mock":
        return "Sample Data (AI Unavailable)";
      default:
        return `AI (${model})`;
    }
  };

  return {
    searchWithAI,
    loading,
    error,
    results,
    clarifyingQuestions,
    searchMetadata,
    modelUsed,
    isAdvancedModelUnavailable,
    fallbackReason,
    validationSummary,
    hasUnverifiedData,
    resetSearch,
  };
}
