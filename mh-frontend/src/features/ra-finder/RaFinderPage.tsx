import { useState } from "react";
import { motion } from "framer-motion";
import { InterestForm } from "./components/InterestForm";
import { LabMatchCard } from "./components/LabMatchCard";
import { SkeletonCard } from "./components/SkeletonCard";
import { mockMatches } from "./data/mockMatches";
import { LabMatch } from "./types/labMatch";
import { Microscope, Brain, Users } from "lucide-react";

export function RaFinderPage() {
  const [keywords, setKeywords] = useState("");
  const [matches, setMatches] = useState<LabMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <InterestForm
            keywords={keywords}
            onKeywordsChange={setKeywords}
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

        {/* Results Section */}
        <div className="mt-8">
          {hasSearched && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {loading
                    ? "Finding matches..."
                    : `Found ${matches.length} matches`}
                </h2>
                {!loading && matches.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Sorted by match score
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
                ) : matches.length > 0 ? (
                  matches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <LabMatchCard match={match} />
                    </motion.div>
                  ))
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
    </div>
  );
}
