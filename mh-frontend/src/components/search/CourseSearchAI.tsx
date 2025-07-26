import { useState } from "react";
import { Search, BookOpen, Star, Clock } from "lucide-react";

export default function CourseSearchAI() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement AI search
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              What are you looking for?
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., machine learning, data science, advanced mathematics..."
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search Courses"}
          </button>
        </form>
      </div>

      {/* Placeholder Results */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          AI Recommendations
        </h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">
                  CS 229: Machine Learning
                </h4>
                <p className="text-gray-600 mt-1">
                  Advanced machine learning algorithms and applications
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />4 credits
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    4.8/5
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Spring 2024
                  </span>
                </div>
              </div>
              <button className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                View Details
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">
                  MATH 104: Linear Algebra
                </h4>
                <p className="text-gray-600 mt-1">
                  Fundamental concepts in linear algebra and matrix theory
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />3 credits
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    4.6/5
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Fall 2024
                  </span>
                </div>
              </div>
              <button className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
