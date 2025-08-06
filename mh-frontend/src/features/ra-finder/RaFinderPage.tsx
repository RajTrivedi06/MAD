import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { InterestForm } from "./components/InterestForm";
import { LabMatchCard } from "./components/LabMatchCard";
import { SkeletonCard } from "./components/SkeletonCard";
import { FilterBar } from "./components/FilterBar";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { QuickActions } from "./components/QuickActions";
// Removed mock data import - no longer needed
import { LabMatch, FilterOptions } from "./types/labMatch";
import { useSavedLabs } from "./hooks/useSavedLabs";
import { useApplicationTracker } from "./hooks/useApplicationTracker";
import { useDeepResearch } from "./hooks/useDeepResearch";
import { useLabValidation } from "./hooks/useLabValidation";
import { ClarificationModal } from "./components/ClarificationModal";
import { ProgressToast } from "./components/ProgressToast";
import { FallbackWarningBanner } from "./components/FallbackWarningBanner";
import { ValidationStatus } from "./components/ValidationStatus";
import { DataAuthenticityWarning } from "./components/DataAuthenticityWarning";
import { Microscope, Brain, Users } from "lucide-react";

export function RaFinderPage() {
  const [interests, setInterests] = useState("");
  const [matches, setMatches] = useState<LabMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [toastType, setToastType] = useState<"loading" | "success" | "error">(
    "loading"
  );

  // Add debug effect to monitor matches state
  useEffect(() => {
    console.log("[RaFinderPage] Matches state updated:", {
      matchCount: matches.length,
      matches: matches,
      firstMatch: matches[0],
      loading,
      hasSearched,
    });
  }, [matches, loading, hasSearched]);

  // Custom hooks for saved labs and application tracking
  const { savedCount, toggleSavedLab, isLabSaved } = useSavedLabs();

  const {
    markAsApplied,
    markResponseReceived,
    updateNotes,
    removeApplication,
    getApplicationStatus,
    getAppliedCount,
    getResponseCount,
  } = useApplicationTracker();

  // Initialize the deep research hook
  const {
    searchWithAI,
    loading: aiLoading,
    error: aiError,
    clarifyingQuestions,
    modelUsed,
    isAdvancedModelUnavailable,
    fallbackReason,
    validationSummary,
    hasUnverifiedData,
    resetSearch,
  } = useDeepResearch({
    onProgress: (message) => {
      setProgressMessage(message);
      // Determine toast type based on message content
      if (message.includes("Error")) {
        setToastType("error");
      } else if (message.includes("Found")) {
        setToastType("success");
      } else {
        setToastType("loading");
      }
    },
  });

  // Initialize lab validation hook
  const { validateAndFilterLabs, getValidationSummary, isDataAuthentic } =
    useLabValidation();

  const handleSearch = async (useProfile: boolean) => {
    console.log("[RaFinderPage] handleSearch called with:", {
      useProfile,
      interests,
    });

    if (useProfile) {
      // Use AI-powered search
      setHasSearched(true);
      console.log("[RaFinderPage] Starting AI search...");

      const result = await searchWithAI(interests);
      console.log("[RaFinderPage] Search result:", result);

      if (result?.needsClarification) {
        console.log("[RaFinderPage] Showing clarification modal");
        setShowClarificationModal(true);
      } else if (result?.labs) {
        console.log(
          "[RaFinderPage] Setting matches with",
          result.labs.length,
          "labs"
        );
        setMatches(result.labs);

        // Log the actual labs received
        console.log("[RaFinderPage] First lab example:", result.labs[0]);

        // Clear progress message after a delay
        setTimeout(() => setProgressMessage(""), 3000);
      } else if (aiError) {
        console.error("[RaFinderPage] AI Error:", aiError);
        // Show error toast
        setProgressMessage(aiError);
        setToastType("error");
        setTimeout(() => setProgressMessage(""), 5000);
      } else {
        console.warn("[RaFinderPage] No result returned from searchWithAI");
      }
    } else {
      // This shouldn't happen based on your code
      console.warn(
        "[RaFinderPage] Non-profile search called - this should not happen"
      );
    }
  };

  // Add handler for clarification modal
  const handleClarificationSubmit = async (answers: Record<string, string>) => {
    setShowClarificationModal(false);
    const result = await searchWithAI(interests, answers);

    if (result?.labs) {
      setMatches(result.labs);
      setTimeout(() => setProgressMessage(""), 3000);
    }
  };

  // Get unique departments for filter
  const departments = useMemo(() => {
    const uniqueDepts = [...new Set(matches.map((match) => match.department))];
    return uniqueDepts.sort();
  }, [matches]);

  // Filter and sort matches based on current filters
  const filteredMatches = useMemo(() => {
    console.log("[RaFinderPage] Filtering matches:", {
      inputCount: matches.length,
      filters: filters,
    });

    let filtered = [...matches];

    // Apply department filter
    if (filters.department && filters.department !== "all") {
      filtered = filtered.filter(
        (match) => match.department === filters.department
      );
      console.log("[RaFinderPage] After department filter:", filtered.length);
    }

    // Apply minimum score filter
    if (filters.minScore && filters.minScore > 0) {
      filtered = filtered.filter(
        (match) => match.fitScore >= (filters.minScore || 0)
      );
      console.log("[RaFinderPage] After score filter:", filtered.length);
    }

    // Apply openings only filter
    if (filters.openingsOnly) {
      filtered = filtered.filter((match) => match.openings === true);
      console.log("[RaFinderPage] After openings filter:", filtered.length);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "newest":
        // For demo purposes, we'll reverse the order
        filtered = filtered.reverse();
        break;
      case "department":
        filtered = filtered.sort((a, b) =>
          a.department.localeCompare(b.department)
        );
        break;
      case "score":
      default:
        filtered = filtered.sort((a, b) => b.fitScore - a.fitScore);
        break;
    }

    console.log("[RaFinderPage] Final filtered matches:", {
      outputCount: filtered.length,
      filtered: filtered,
    });

    return filtered;
  }, [matches, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-red-50 to-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Microscope className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Research Assistant Finder
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Discover research opportunities that match your interests and
              skills. Get personalized recommendations based on your academic
              profile.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">150+</div>
              <div className="text-sm text-gray-600">Active Labs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">50+</div>
              <div className="text-sm text-gray-600">Departments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">89%</div>
              <div className="text-sm text-gray-600">Match Success</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <InterestForm
            interests={interests}
            onInterestsChange={setInterests}
            onSearch={handleSearch}
            loading={loading || aiLoading}
            className="mb-12"
          />
        </div>

        {/* Fallback Warning Banner */}
        <FallbackWarningBanner
          isVisible={
            hasSearched &&
            !loading &&
            (modelUsed === "gpt-4o" ||
              modelUsed === "none" ||
              modelUsed === "fallback-mock")
          }
          fallbackReason={fallbackReason}
          modelUsed={modelUsed}
        />

        {/* Data Authenticity Warning */}
        <DataAuthenticityWarning
          labCount={matches.length}
          hasUnverifiedData={hasUnverifiedData}
          validationRate={validationSummary?.validationRate}
        />

        {/* Progress Dashboard */}
        {hasSearched && (
          <ProgressDashboard
            matchCount={filteredMatches.length}
            savedCount={savedCount}
            appliedCount={getAppliedCount()}
            responseCount={getResponseCount()}
          />
        )}

        {/* Results Section */}
        <div className="mt-8">
          {hasSearched && (
            <>
              {/* Filter Bar */}
              {matches.length > 0 && !loading && (
                <FilterBar
                  onFilterChange={setFilters}
                  departments={departments}
                  matchCount={filteredMatches.length}
                  activeFilters={filters}
                />
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {loading ? "Finding matches..." : `Research Opportunities`}
                  </h2>
                  {modelUsed && !loading && filteredMatches.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          modelUsed === "o4-mini-deep-research"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : modelUsed === "gpt-4o"
                            ? isAdvancedModelUnavailable
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {modelUsed === "o4-mini-deep-research"
                          ? "🚀 Advanced AI"
                          : modelUsed === "gpt-4o"
                          ? isAdvancedModelUnavailable
                            ? "⚠️ Fallback AI"
                            : "🧠 Standard AI"
                          : "📊 Sample Data"}
                      </span>
                    </div>
                  )}
                </div>
                {!loading && filteredMatches.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Showing {filteredMatches.length} of {matches.length} matches
                  </span>
                )}
              </div>

              {/* Validation Status */}
              {!loading && filteredMatches.length > 0 && (
                <ValidationStatus labs={filteredMatches} />
              )}

              <div className="space-y-4">
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : filteredMatches.length > 0 ? (
                  filteredMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <LabMatchCard
                        match={match}
                        isSaved={isLabSaved(match.id)}
                        onToggleSaved={toggleSavedLab}
                        applicationStatus={getApplicationStatus(match.id)}
                        onMarkAsApplied={markAsApplied}
                        onMarkResponseReceived={markResponseReceived}
                        onUpdateNotes={updateNotes}
                        onRemoveApplication={removeApplication}
                      />
                    </motion.div>
                  ))
                ) : matches.length > 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No matches found with current filters. Try adjusting your
                      criteria.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No matches found. Try different keywords.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {!hasSearched && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Start Your Research Journey
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Enter your research interests or let us recommend labs based on
                your academic profile.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Floating Menu */}
      <QuickActions
        matches={filteredMatches}
        savedCount={savedCount}
        appliedCount={getAppliedCount()}
        onShowSavedLabs={() => {
          // TODO: Implement saved labs modal
          alert(`You have ${savedCount} saved labs`);
        }}
        onShowStats={() => {
          // TODO: Implement statistics modal
          alert(
            `Statistics: ${
              filteredMatches.length
            } matches, ${savedCount} saved, ${getAppliedCount()} applied`
          );
        }}
      />

      {/* Clarification Modal */}
      <ClarificationModal
        isOpen={showClarificationModal}
        onClose={() => {
          setShowClarificationModal(false);
          resetSearch();
        }}
        questions={clarifyingQuestions}
        onSubmit={handleClarificationSubmit}
        loading={aiLoading}
      />

      {/* Progress Toast */}
      <ProgressToast
        message={progressMessage}
        isVisible={!!progressMessage}
        type={toastType}
      />
    </div>
  );
}
