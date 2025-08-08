// CourseSearchAI.tsx
"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Clock,
  BookOpen,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Send,
  Bot,
  CheckCircle,
} from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import {
  useCourseSubjects,
  useTerms,
  useColleges,
  useBreadthRequirements,
  useGeneralEducationRequirements,
  useLevels,
  useCLOAudiences,
} from "@/hooks/useFilterOptions";
import { useCredits } from "@/hooks/useCredits";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import type {
  CourseFilters,
  CourseWithRequirements,
} from "@/types/course.types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ExpandableCourseCard } from "@/components/ExpandableCourseCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactFlowPrerequisiteGraph } from "@/components/ReactFlowPrerequisiteGraph";
import { PrerequisiteDebugger } from "@/components/PrerequisiteDebugger";
import { SectionsView } from "@/components/SectionsView";
import { useBackendAPI } from "@/hooks/useBackendAPI";
// no direct supabase import here; dynamic import is used in handler
import OpenAI from "openai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** ---------- Reusable UI subcomponents ---------- */
const FilterSection = ({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border-b border-gray-200 pb-4">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-900 hover:text-gray-700"
    >
      <span>{title}</span>
      <ChevronDown
        className={`w-4 h-4 transition-transform ${
          expanded ? "rotate-180" : ""
        }`}
      />
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-2">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const CheckboxGroup = ({
  options,
  selected,
  onChange,
  maxHeight = "max-h-48",
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  maxHeight?: string;
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) onChange([...selected, value]);
    else onChange(selected.filter((v) => v !== value));
  };

  return (
    <div className={`space-y-2 overflow-y-auto ${maxHeight}`}>
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 text-sm cursor-pointer hover:text-gray-700"
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={(e) => handleChange(option, e.target.checked)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="truncate">{option}</span>
        </label>
      ))}
    </div>
  );
};

const SearchableCheckboxGroup = ({
  options,
  selected,
  onChange,
  maxHeight = "max-h-48",
  placeholder = "Search...",
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  maxHeight?: string;
  placeholder?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChange = (value: string, checked: boolean) => {
    if (checked) onChange([...selected, value]);
    else onChange(selected.filter((v) => v !== value));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
      </div>
      <div className={`space-y-2 overflow-y-auto ${maxHeight}`}>
        {filteredOptions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No subjects found matching &quot;{searchQuery}&quot;
          </p>
        ) : (
          filteredOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-sm cursor-pointer hover:text-gray-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => handleChange(option, e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="truncate">{option}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
};

const CourseCard = ({
  course,
  selected,
  onSelect,
}: {
  course: CourseWithRequirements;
  selected: boolean;
  onSelect: () => void;
}) => {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`relative p-4 bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all ${
        selected
          ? "border-red-500 shadow-md"
          : "border-transparent hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-black">{course.course_code}</h3>
      </div>

      <p className="text-black text-base mb-3 font-medium line-clamp-2">
        {course.title}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {course.course_requirements?.breadth_or?.map((breadth, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"
          >
            {breadth}
          </span>
        ))}
        {course.course_requirements?.gened_and?.map((gened, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"
          >
            {gened}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-700">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.credits} credits
        </span>
        {course.crosslisted && (
          <span className="text-red-600 font-medium">Crosslisted</span>
        )}
      </div>
    </motion.div>
  );
};

/** ---------- AI Interest Input (interest box only) ---------- */
const AIInterestInput = ({
  aiInterest,
  setAiInterest,
  onSubmit,
  isProcessing = false,
}: {
  aiInterest: string;
  setAiInterest: (value: string) => void;
  onSubmit: () => void;
  isProcessing?: boolean;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-gray-50 to-gray-100 border border-red-200 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-red-600 rounded-full">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Tell AI About Your Interests
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                value={aiInterest}
                onChange={(e) => setAiInterest(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your interests or what you need to fulfill (e.g., 'COMM-B that also covers data ethics', 'ML/data science blend')"
                className="w-full px-4 py-3 pr-12 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
                rows={3}
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="absolute bottom-3 right-3 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Submit"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-red-700">
              Press Enter to submit, or Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

/** ---------- Main Component ---------- */
export function CourseSearchAI() {
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithRequirements | null>(null);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(
    new Set()
  );
  const [aiMode, setAiMode] = useState(false);
  const [aiInterest, setAiInterest] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [aiRecs, setAiRecs] = useState<CourseWithRequirements[] | null>(null);
  const [aiCourseInfo, setAiCourseInfo] = useState<string | null>(null);
  const [aiCourseInfoLoading, setAiCourseInfoLoading] =
    useState<boolean>(false);
  const pageSize = 50;

  const { recommendByInterest } = useBackendAPI();

  const [filters, setFilters] = useState<CourseFilters>({
    searchQuery: "",
    catalogNumber: "",
    term: "Fall 2025",
    courseCode: [],
    college: [],
    level: [],
    credits: [],
    crosslisted: null,
    breadth: [],
    generalEducation: [],
    repeatable: null,
    cloAudience: [],
    limit: pageSize,
    offset: 0,
  });

  const { subjects } = useCourseSubjects();
  const { terms } = useTerms();
  const { colleges } = useColleges();
  const { breadthRequirements } = useBreadthRequirements();
  const { genEdRequirements } = useGeneralEducationRequirements();
  const { levels } = useLevels();
  const { credits: availableCredits } = useCredits();
  const { audiences } = useCLOAudiences();

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: query,
      offset: 0,
    }));
    setCurrentPage(0);
  }, []);
  const { searchQuery, setSearchQuery } = useDebouncedSearch(handleSearch, 300);

  const { courses, loading, error, totalCount, refetch } = useCourses(filters);

  const toggleFilter = (name: string) => {
    setExpandedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleFilterChange = (
    filterType: keyof CourseFilters,
    value: string | string[] | boolean | null | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(0);
  };

  const handleCourseSelect = (course: CourseWithRequirements) => {
    setSelectedCourse(course);
    setAiCourseInfo(null);
  };

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
    setFilters((prev) => ({
      ...prev,
      offset: (currentPage + 1) * pageSize,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: "",
      catalogNumber: "",
      term: "Fall 2025",
      courseCode: [],
      college: [],
      level: [],
      credits: [],
      crosslisted: null,
      breadth: [],
      generalEducation: [],
      repeatable: null,
      cloAudience: [],
      limit: pageSize,
      offset: 0,
    });
    setSearchQuery("");
    setCurrentPage(0);
    setAiRecs(null);
  };

  /** ---------- AI submit: interest-only over all courses ---------- */
  const handleAISubmit = async () => {
    setIsProcessingAI(true);
    setAiRecs(null);
    try {
      const top_k = 10;
      if (!aiInterest.trim()) {
        setAiRecs([]);
      } else {
        const results = await recommendByInterest({
          interest_text: aiInterest.trim(),
          top_k,
        });
        const ids = results.map((r) => r.course_id);
        if (ids.length === 0) {
          setAiRecs([]);
        } else {
          // Fetch details via backend to avoid client-side RLS
          const { data: sessionRes } = await (
            await import("@/lib/supabase/client")
          ).supabase.auth.getSession();
          const token = sessionRes.session?.access_token;
          const detailsRes = await fetch(
            `${
              process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
            }/api/courses/by_ids`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(ids),
            }
          );
          if (!detailsRes.ok) throw new Error(await detailsRes.text());
          const data = (await detailsRes.json()) as CourseWithRequirements[];
          setAiRecs(data || []);
        }
      }
    } catch (error) {
      console.error("AI processing error:", error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const fetchAIClassInformation = async (course: CourseWithRequirements) => {
    try {
      setAiCourseInfoLoading(true);
      setAiCourseInfo(null);
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) throw new Error("Missing NEXT_PUBLIC_OPENAI_API_KEY");

      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

      const courseName = `${course.course_code ?? ""}: ${
        course.title ?? ""
      }`.trim();
      const prompt = `You are a course research assistant. Using your integrated web browsing/search tools, find all useful, student-relevant information you can about ${courseName} at UW-Madison. Include:
- recent insights from Reddit or student forums
- links or references to syllabus (if publicly available)
- course structure, workload, typical topics, assessments, instructor notes
- useful reviews and takeaways
For each cited piece of info, include the year it is from. Only include course-related content (no model disclaimers or meta commentary).`;

      const response = await client.responses.create({
        model: "gpt-4.1",
        tools: [
          {
            type: "web_search_preview",
            search_context_size: "low",
          },
        ],
        input: prompt,
      });

      const text =
        (response as unknown as { output_text?: string }).output_text ?? "";
      setAiCourseInfo(text || "No information found.");
    } catch (e) {
      setAiCourseInfo(
        e instanceof Error
          ? e.message
          : "Failed to fetch AI course information."
      );
    } finally {
      setAiCourseInfoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Clear all
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term
              </label>
              <select
                value={filters.term || ""}
                onChange={(e) =>
                  handleFilterChange("term", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
              >
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            {/* Add by Class Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add by Class Number
              </label>
              <input
                type="text"
                value={filters.catalogNumber || ""}
                onChange={(e) =>
                  handleFilterChange("catalogNumber", e.target.value)
                }
                placeholder="e.g., 300, 577"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Subject */}
            <FilterSection
              title="Subject"
              expanded={expandedFilters.has("subject")}
              onToggle={() => toggleFilter("subject")}
            >
              <SearchableCheckboxGroup
                options={subjects}
                selected={filters.courseCode || []}
                onChange={(values) => handleFilterChange("courseCode", values)}
                maxHeight="max-h-48"
                placeholder="Search subjects..."
              />
            </FilterSection>

            {/* College */}
            <FilterSection
              title="College"
              expanded={expandedFilters.has("college")}
              onToggle={() => toggleFilter("college")}
            >
              <CheckboxGroup
                options={colleges}
                selected={filters.college || []}
                onChange={(values) => handleFilterChange("college", values)}
                maxHeight="max-h-48"
              />
            </FilterSection>

            {/* Breadth */}
            <FilterSection
              title="Breadth"
              expanded={expandedFilters.has("breadth")}
              onToggle={() => toggleFilter("breadth")}
            >
              <CheckboxGroup
                options={breadthRequirements}
                selected={filters.breadth || []}
                onChange={(values) => handleFilterChange("breadth", values)}
                maxHeight="max-h-48"
              />
            </FilterSection>

            {/* Gen Ed */}
            <FilterSection
              title="General Education"
              expanded={expandedFilters.has("genEd")}
              onToggle={() => toggleFilter("genEd")}
            >
              <CheckboxGroup
                options={genEdRequirements}
                selected={filters.generalEducation || []}
                onChange={(values) =>
                  handleFilterChange("generalEducation", values)
                }
                maxHeight="max-h-48"
              />
            </FilterSection>

            {/* Level */}
            <FilterSection
              title="Level"
              expanded={expandedFilters.has("level")}
              onToggle={() => toggleFilter("level")}
            >
              <CheckboxGroup
                options={levels}
                selected={filters.level || []}
                onChange={(values) => handleFilterChange("level", values)}
              />
            </FilterSection>

            {/* Credits */}
            <FilterSection
              title="Credits"
              expanded={expandedFilters.has("credits")}
              onToggle={() => toggleFilter("credits")}
            >
              <CheckboxGroup
                options={availableCredits}
                selected={filters.credits || []}
                onChange={(values) => handleFilterChange("credits", values)}
                maxHeight="max-h-48"
              />
            </FilterSection>

            {/* Audience */}
            <FilterSection
              title="Course Audience"
              expanded={expandedFilters.has("audience")}
              onToggle={() => toggleFilter("audience")}
            >
              <CheckboxGroup
                options={audiences}
                selected={filters.cloAudience || []}
                onChange={(values) => handleFilterChange("cloAudience", values)}
              />
            </FilterSection>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-black">Course Search</h1>
                {aiMode && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                  >
                    AI Mode
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAiMode(!aiMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    aiMode
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {aiMode ? "AI Mode On" : "AI Mode Off"}
                </button>
              </div>
            </div>
          </div>

          {/* AI Interest Input */}
          <AnimatePresence>
            {aiMode && (
              <div className="px-8 py-4 bg-gray-50">
                <AIInterestInput
                  aiInterest={aiInterest}
                  setAiInterest={setAiInterest}
                  onSubmit={handleAISubmit}
                  isProcessing={isProcessingAI}
                />
              </div>
            )}
          </AnimatePresence>

          {/* AI Recommendations strip */}
          {aiMode && aiRecs && (
            <div className="bg-white border-b border-gray-200 px-8 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-semibold text-black">
                  AI Recommendations
                </h3>
              </div>
              {aiRecs.length === 0 ? (
                <p className="text-sm text-gray-700">
                  No recommendations yet. Try adding interests.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiRecs.map((course: CourseWithRequirements) => (
                    <CourseCard
                      key={course.course_id}
                      course={course}
                      selected={selectedCourse?.course_id === course.course_id}
                      onSelect={() => handleCourseSelect(course)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          <div className="bg-gray-50 px-8 py-3 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {(() => {
                if (aiMode && aiRecs) {
                  return `Showing ${aiRecs.length} AI results`;
                }
                if (loading) return "Loading courses...";
                if (error)
                  return (
                    <span className="text-red-600">Error loading courses</span>
                  );
                return (
                  <>
                    {`Showing ${courses.length} of ${Number(
                      totalCount
                    )} courses`}
                    {!!(
                      filters.searchQuery ||
                      filters.catalogNumber ||
                      filters.college?.length ||
                      filters.level?.length ||
                      filters.credits?.length ||
                      filters.breadth?.length ||
                      filters.generalEducation?.length
                    ) && " (filtered)"}
                  </>
                );
              })()}
            </p>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Course List */}
            <div
              className={`${
                aiMode ? "w-full" : "w-3/10"
              } p-6 overflow-y-auto border-r border-gray-200`}
            >
              {error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading Courses
                  </h3>
                  <p className="text-gray-600 mb-4">{error.message}</p>
                  <button
                    onClick={refetch}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : loading && currentPage === 0 && !(aiMode && aiRecs) ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" color="blue" />
                  <span className="ml-2 text-gray-600">Loading courses...</span>
                </div>
              ) : (
                  aiMode && aiRecs ? aiRecs.length === 0 : courses.length === 0
                ) ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {aiMode && aiRecs ? "No AI results" : "No courses found"}
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {(aiMode && aiRecs ? aiRecs : courses).map((course) =>
                      aiMode && aiRecs ? (
                        <ExpandableCourseCard
                          key={course.course_id}
                          course={course}
                        />
                      ) : (
                        <CourseCard
                          key={course.course_id}
                          course={course}
                          selected={
                            selectedCourse?.course_id === course.course_id
                          }
                          onSelect={() => handleCourseSelect(course)}
                        />
                      )
                    )}
                  </div>

                  {!(aiMode && aiRecs) && courses.length < totalCount && (
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="mt-6 w-full py-3 text-red-700 font-medium flex items-center justify-center gap-2 hover:text-red-100 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Loading more...
                        </>
                      ) : (
                        <>
                          Load more courses
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Course Details (hidden in AI mode; modal handles details) */}
            {!aiMode && (
              <div className="w-7/10 p-6 overflow-y-auto bg-gray-50">
                {selectedCourse ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-black mb-2">
                        {selectedCourse.course_code}: {selectedCourse.title}
                      </h2>
                    </div>

                    <Tabs defaultValue="description" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="description">
                          Course Description
                        </TabsTrigger>
                        <TabsTrigger value="sections">
                          Available Sections
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="description" className="space-y-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h3 className="font-semibold text-black mb-4">
                            Description
                          </h3>
                          <p className="text-gray-700 leading-relaxed">
                            {selectedCourse.description}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h3 className="font-semibold text-black mb-4">
                            Course Details
                          </h3>
                          <div className="mb-3">
                            <button
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                              onClick={() =>
                                selectedCourse &&
                                fetchAIClassInformation(selectedCourse)
                              }
                              disabled={aiCourseInfoLoading}
                            >
                              {aiCourseInfoLoading
                                ? "Fetching AI Class Information…"
                                : "AI Class Information"}
                            </button>
                          </div>
                          <dl className="space-y-3">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Credits</dt>
                              <dd className="font-medium text-gray-900">
                                {selectedCourse.credits}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Level</dt>
                              <dd className="font-medium text-gray-900">
                                {selectedCourse.level}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">College</dt>
                              <dd className="font-medium text-gray-900">
                                {selectedCourse.college}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Last Taught</dt>
                              <dd className="font-medium text-gray-900">
                                {selectedCourse.last_taught_term}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Course Audience</dt>
                              <dd className="font-medium text-gray-900">
                                {selectedCourse.clo_audience || "Not specified"}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Crosslisted</dt>
                              <dd className="font-medium text-gray-900">
                                {selectedCourse.crosslisted ? "Yes" : "No"}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Repeatable</dt>
                              <dd className="font-medium text-gray-900">
                                {selectedCourse.repeatable ? "Yes" : "No"}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        {aiCourseInfo && (
                          <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-black mb-3">
                              AI Class Information
                            </h3>
                            <div className="prose prose-sm max-w-none text-gray-900">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {aiCourseInfo}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {((selectedCourse.course_requirements?.breadth_or
                          ?.length || 0) > 0 ||
                          (selectedCourse.course_requirements?.gened_and
                            ?.length || 0) > 0) && (
                          <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-black mb-3">
                              Requirements Fulfilled
                            </h3>
                            <div className="space-y-2">
                              {(selectedCourse.course_requirements?.breadth_or
                                ?.length || 0) > 0 && (
                                <div>
                                  <span className="text-sm text-gray-600">
                                    Breadth:
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedCourse.course_requirements?.breadth_or?.map(
                                      (req, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                                        >
                                          {req}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                              {(selectedCourse.course_requirements?.gened_and
                                ?.length || 0) > 0 && (
                                <div>
                                  <span className="text-sm text-gray-600">
                                    General Education:
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedCourse.course_requirements?.gened_and?.map(
                                      (req, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                                        >
                                          {req}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedCourse.learning_outcomes &&
                          selectedCourse.learning_outcomes !== "NaN" && (
                            <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 shadow-md border border-blue-100">
                              <h3 className="font-semibold text-black mb-4 flex items-center gap-2 text-lg">
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                                Learning Outcomes
                              </h3>
                              {(() => {
                                const raw = selectedCourse.learning_outcomes;
                                const cleaned = raw.trim().replace(/;+$/, "");
                                const outcomes = cleaned
                                  .split(/\s*\d+[:\.]\s+|;\s*/)
                                  .filter(Boolean);
                                if (outcomes.length > 1) {
                                  return (
                                    <ul className="list-none space-y-3 pl-0">
                                      {outcomes.map((outcome, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start gap-2"
                                        >
                                          <span className="text-gray-800 leading-relaxed">
                                            {outcome.trim()}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                } else {
                                  return (
                                    <p className="text-gray-700 whitespace-pre-line">
                                      {selectedCourse.learning_outcomes}
                                    </p>
                                  );
                                }
                              })()}
                            </div>
                          )}

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Prerequisite Journey
                          </h3>

                          <ReactFlowPrerequisiteGraph
                            courseId={selectedCourse.course_id}
                            onNodeClick={(courseId: number) => {
                              console.log("Clicked course:", courseId);
                            }}
                            showPrompt={true}
                          />
                        </div>

                        {selectedCourse.pre_requisites && (
                          <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-black mb-3">
                              Prerequisites
                            </h3>
                            <p className="text-gray-700">
                              {selectedCourse.pre_requisites}
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="sections" className="space-y-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h3 className="font-semibold text-black mb-4">
                            Available Sections
                          </h3>
                          {selectedCourse && (
                            <SectionsView courseId={selectedCourse.course_id} />
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-gray-700">
                        Select a course to view details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
