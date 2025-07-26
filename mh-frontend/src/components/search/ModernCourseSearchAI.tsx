"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  Users,
  Star,
  Brain,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const aiSuggestions = [
  "Show me courses in machine learning",
  "Find research-focused computer science courses",
  "Recommend courses for data science",
  "What are the best AI courses this semester?",
];

const aiInsights = [
  {
    type: "trending",
    title: "AI & ML Courses Trending",
    description: "Enrollment in AI courses has increased by 45% this semester",
    icon: TrendingUp,
    color: "from-accent-muted-teal to-accent-steel-blue",
  },
  {
    type: "recommendation",
    title: "Based on Your Profile",
    description:
      "You might enjoy 'Advanced Neural Networks' - matches your interests",
    icon: Brain,
    color: "from-red-600 to-red-700",
  },
  {
    type: "opportunity",
    title: "Research Opportunity",
    description: "CS 4501 has open research assistant positions",
    icon: Sparkles,
    color: "from-accent-rich-gold to-red-600",
  },
];

const courses = [
  {
    id: 1,
    title: "Introduction to Machine Learning",
    code: "CS 4501",
    department: "Computer Science",
    credits: 3,
    instructor: "Dr. Sarah Chen",
    rating: 4.8,
    students: 156,
    description: "Fundamental concepts and algorithms in machine learning",
    tags: ["AI", "Data Science", "Programming"],
    difficulty: "Intermediate",
  },
  {
    id: 2,
    title: "Advanced Data Structures",
    code: "CS 3102",
    department: "Computer Science",
    credits: 3,
    instructor: "Prof. Michael Rodriguez",
    rating: 4.6,
    students: 89,
    description: "Advanced data structures and algorithm analysis",
    tags: ["Algorithms", "Programming", "Theory"],
    difficulty: "Advanced",
  },
  {
    id: 3,
    title: "Computer Vision",
    code: "CS 4501",
    department: "Computer Science",
    credits: 3,
    instructor: "Dr. Emily Watson",
    rating: 4.9,
    students: 72,
    description: "Image processing and computer vision techniques",
    tags: ["AI", "Computer Vision", "Image Processing"],
    difficulty: "Advanced",
  },
  {
    id: 4,
    title: "Software Engineering",
    code: "CS 3240",
    department: "Computer Science",
    credits: 3,
    instructor: "Prof. David Kim",
    rating: 4.4,
    students: 134,
    description: "Software development methodologies and practices",
    tags: ["Software", "Development", "Teamwork"],
    difficulty: "Intermediate",
  },
];

const filters = [
  { name: "Computer Science", count: 45 },
  { name: "Mathematics", count: 23 },
  { name: "Engineering", count: 34 },
  { name: "Physics", count: 18 },
];

export default function ModernCourseSearchAI() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAISearching, setIsAISearching] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleAISearch = async (query: string) => {
    setIsAISearching(true);
    setSearchQuery(query);
    // Simulate AI processing
    setTimeout(() => {
      setIsAISearching(false);
    }, 2000);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-slate to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            AI-Powered Course Search
          </h1>
          <p className="text-neutral-cool-grey text-lg max-w-2xl mx-auto">
            Discover the perfect courses with intelligent recommendations and
            insights
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-cool-grey" />
              <input
                type="text"
                placeholder="Search for courses, professors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-neutral-slate/50 backdrop-blur-sm border border-red-500/20 rounded-xl text-white placeholder-neutral-cool-grey focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-200"
              />
            </div>

            {/* AI Suggestions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleAISearch(suggestion)}
                  className="px-4 py-2 bg-gradient-to-r from-accent-muted-teal/20 to-accent-steel-blue/20 border border-accent-muted-teal/30 rounded-lg text-accent-muted-teal hover:from-accent-muted-teal/30 hover:to-accent-steel-blue/30 transition-all duration-200 text-sm font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {aiInsights.map((insight, index) => (
            <div
              key={index}
              className="bg-neutral-slate/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 hover:border-red-500/30 transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-r ${insight.color}`}
                >
                  <insight.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {insight.title}
                  </h3>
                  <p className="text-neutral-cool-grey text-sm">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Results */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <div className="bg-neutral-slate/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 text-neutral-cool-grey hover:text-white"
                >
                  {showFilters ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Filter className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div
                className={`${
                  showFilters ? "block" : "hidden"
                } lg:block space-y-4`}
              >
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">
                    Departments
                  </h4>
                  <div className="space-y-2">
                    {filters.map((filter) => (
                      <label
                        key={filter.name}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFilters.includes(filter.name)}
                          onChange={() => toggleFilter(filter.name)}
                          className="rounded border-red-500/30 text-red-600 focus:ring-red-500/50 bg-neutral-slate/50"
                        />
                        <span className="text-sm text-neutral-cool-grey">
                          {filter.name} ({filter.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Results */}
          <div className="flex-1">
            {isAISearching ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-neutral-cool-grey">
                  AI is analyzing your search...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-neutral-slate/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 hover:border-red-500/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">
                            {course.title}
                          </h3>
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                            {course.code}
                          </span>
                        </div>

                        <p className="text-neutral-cool-grey mb-4">
                          {course.description}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-neutral-cool-grey mb-4">
                          <span className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {course.department}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {course.credits} credits
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.students} students
                          </span>
                          <span className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-accent-rich-gold" />
                            {course.rating}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {course.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-accent-steel-blue/20 text-accent-steel-blue text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col items-end space-y-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            course.difficulty === "Advanced"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-accent-muted-teal/20 text-accent-muted-teal"
                          }`}
                        >
                          {course.difficulty}
                        </span>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200">
                          <span>View Details</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
