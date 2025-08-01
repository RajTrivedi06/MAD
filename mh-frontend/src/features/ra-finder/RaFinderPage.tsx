import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { InterestForm } from "./components/InterestForm";
import { LabMatchCard } from "./components/LabMatchCard";
import { SkeletonCard } from "./components/SkeletonCard";
import { FilterBar } from "./components/FilterBar";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { QuickActions } from "./components/QuickActions";
import { mockMatches } from "./data/mockMatches";
import { LabMatch, FilterOptions } from "./types/labMatch";
import { useSavedLabs } from "./hooks/useSavedLabs";
import { useApplicationTracker } from "./hooks/useApplicationTracker";
import { Microscope, Brain, Users } from "lucide-react";

export function RaFinderPage() {
  const [keywords, setKeywords] = useState("");
  const [matches, setMatches] = useState<LabMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

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

  const handleSearch = async (useProfile: boolean) => {
    setLoading(true);
    setHasSearched(true);
    // Simulate API call
    console.log("Searching with profile:", useProfile);
    setTimeout(() => {
      setMatches(mockMatches);
      setLoading(false);
    }, 1500);
  };

  // Get unique departments for filter
  const departments = useMemo(() => {
    const uniqueDepts = [...new Set(matches.map((match) => match.department))];
    return uniqueDepts.sort();
  }, [matches]);

  // Filter and sort matches based on current filters
  const filteredMatches = useMemo(() => {
    let filtered = [...matches];

    // Apply department filter
    if (filters.department && filters.department !== "all") {
      filtered = filtered.filter(
        (match) => match.department === filters.department
      );
    }

    // Apply minimum score filter
    if (filters.minScore && filters.minScore > 0) {
      filtered = filtered.filter(
        (match) => match.fitScore >= (filters.minScore || 0)
      );
    }

    // Apply openings only filter
    if (filters.openingsOnly) {
      filtered = filtered.filter((match) => match.openings === true);
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
            keywords={keywords}
            onKeywordsChange={setKeywords}
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

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
                <h2 className="text-xl font-semibold text-gray-900">
                  {loading ? "Finding matches..." : `Research Opportunities`}
                </h2>
                {!loading && filteredMatches.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Showing {filteredMatches.length} of {matches.length} matches
                  </span>
                )}
              </div>

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
    </div>
  );
}
