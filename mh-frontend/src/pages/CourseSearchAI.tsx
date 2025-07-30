import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import * as d3 from "d3";

// Interfaces
interface Course {
  course_id: number;
  course_code: string;
  catalog_number: string;
  title: string;
  description: string;
  credits: string;
  credit_level: string;
  level: string;
  repeatable: boolean;
  pre_requisites: string;
  college: string;
  topic_type: boolean;
  learning_outcomes: string;
  clo_audience: string;
  embedding: number[];
  last_taught_term: string;
  years_since_last_taught: string;
  crosslisted: boolean;
  subject_codes: number[];
  relevance?: number;
  topic_tags?: string[];
  instructor?: string;
  enrollment?: number;
}

interface FilterOption {
  label: string;
  value: string;
  expandable: boolean;
}

// Mock data hook
const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real API call
    setTimeout(() => {
      setCourses(mockCourses);
      setLoading(false);
    }, 800);
  }, []);

  return { courses, loading };
};

// Mock AI recommendations hook
const useAIRecommendations = (
  query: string,
  filters: Record<string, string>
) => {
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query || Object.keys(filters).length > 0) {
      setLoading(true);
      setTimeout(() => {
        const filtered = mockCourses
          .map((course) => ({
            ...course,
            relevance: Math.floor(Math.random() * 30) + 70,
            topic_tags: getTopicTags(course.course_code),
          }))
          .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

        setRecommendations(filtered);
        setLoading(false);
      }, 600);
    }
  }, [query, filters]);

  return { recommendations, loading };
};

// Helper to get topic tags
const getTopicTags = (courseCode: string): string[] => {
  const tagMap: Record<string, string[]> = {
    "COMP SCI": ["AI", "Algorithms", "Programming"],
    STAT: ["Data Science", "Analytics", "Probability"],
    ECE: ["Robotics", "Circuits", "Systems"],
    MATH: ["Calculus", "Linear Algebra", "Theory"],
    PHYSICS: ["Quantum", "Mechanics", "Nuclear"],
  };
  return tagMap[courseCode] || ["General"];
};

// Mock courses
const mockCourses: Course[] = [
  {
    course_id: 1,
    course_code: "COMP SCI",
    catalog_number: "300",
    title: "Programming II",
    description:
      "Advanced programming concepts including data structures, algorithms, and software engineering principles.",
    credits: "3",
    credit_level: "Undergraduate",
    level: "Intermediate",
    repeatable: false,
    pre_requisites: "COMP SCI 200",
    college: "Letters & Science",
    topic_type: false,
    learning_outcomes: "Master advanced data structures and patterns.",
    clo_audience: "Computer Science Majors",
    embedding: [],
    last_taught_term: "Fall 2024",
    years_since_last_taught: "0",
    crosslisted: false,
    subject_codes: [266],
    instructor: "Dr. Sarah Johnson",
    enrollment: 150,
  },
  {
    course_id: 2,
    course_code: "STAT",
    catalog_number: "301",
    title: "Introduction to Statistical Methods",
    description:
      "Basic concepts of statistics including probability, distributions, hypothesis testing, and regression.",
    credits: "3",
    credit_level: "Undergraduate",
    level: "Intermediate",
    repeatable: false,
    pre_requisites: "MATH 222",
    college: "Letters & Science",
    topic_type: false,
    learning_outcomes:
      "Understanding of fundamental statistical concepts and applications.",
    clo_audience: "STEM Majors",
    embedding: [],
    last_taught_term: "Spring 2024",
    years_since_last_taught: "0",
    crosslisted: true,
    subject_codes: [775],
    instructor: "Prof. Michael Chen",
    enrollment: 200,
  },
  {
    course_id: 3,
    course_code: "ECE",
    catalog_number: "352",
    title: "Digital System Fundamentals",
    description:
      "Introduction to digital logic, computer organization, and embedded design.",
    credits: "3",
    credit_level: "Undergraduate",
    level: "Intermediate",
    repeatable: false,
    pre_requisites: "ECE 252",
    college: "Engineering",
    topic_type: false,
    learning_outcomes:
      "Design and implement digital systems using modern tools.",
    clo_audience: "Engineering Students",
    embedding: [],
    last_taught_term: "Fall 2024",
    years_since_last_taught: "0",
    crosslisted: false,
    subject_codes: [266],
    instructor: "Dr. Emily Rodriguez",
    enrollment: 120,
  },
];

// Grade distribution chart
const GradeDistributionChart = ({ courseId }: { courseId: number }) => {
  useEffect(() => {
    const data = [
      { grade: "A", count: 45 },
      { grade: "AB", count: 35 },
      { grade: "B", count: 25 },
      { grade: "BC", count: 15 },
      { grade: "C", count: 10 },
      { grade: "D", count: 5 },
      { grade: "F", count: 2 },
    ];

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const container = d3.select(`#grade-chart-${courseId}`);
    container.selectAll("*").remove();

    const svg = container
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(data.map((d) => d.grade))
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 0])
      .range([height, 0]);

    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.grade) || 0)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.count))
      .attr("height", (d) => height - y(d.count));

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));
  }, [courseId]);

  return <div id={`grade-chart-${courseId}`} className="w-full"></div>;
};

// Course card
const CourseCard = ({
  course,
  selected,
  onSelect,
  showRelevance = false,
}: {
  course: Course;
  selected: boolean;
  onSelect: () => void;
  showRelevance?: boolean;
}) => {
  const tagColors: Record<string, string> = {
    AI: "bg-red-100 text-red-700",
    Cars: "bg-green-100 text-green-700",
    Nuclear: "bg-blue-100 text-blue-700",
    "Data Science": "bg-purple-100 text-purple-700",
    Robotics: "bg-yellow-100 text-yellow-700",
    Default: "bg-gray-100 text-gray-700",
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`relative p-4 bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all ${
        selected
          ? "border-blue-500 shadow-md"
          : "border-transparent hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-xl text-black">
          {course.course_code} {course.catalog_number}
        </h3>
        <div className="flex gap-2">
          {course.topic_tags?.map((tag, i) => (
            <span
              key={i}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                tagColors[tag] || tagColors.Default
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <p className="text-black text-base mb-3 font-medium">{course.title}</p>

      {showRelevance && course.relevance && (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Sparkles className="w-4 h-4" />
          <span>Relevance: {course.relevance}%</span>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-700 mt-2">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.credits} credits
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {course.enrollment || 0} enrolled
        </span>
      </div>
    </motion.div>
  );
};

// Main component
const CourseSearchAIContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set()
  );
  const [showComparison, setShowComparison] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(
    new Set()
  );
  const [aiMode, setAiMode] = useState(true);
  const [groupByTopic, setGroupByTopic] = useState(false);

  const { courses, loading: coursesLoading } = useCourses();
  const { recommendations, loading: recsLoading } = useAIRecommendations(
    searchQuery,
    activeFilters
  );

  const filters: FilterOption[] = [
    { label: "Breadth", value: "", expandable: true },
    { label: "General Education", value: "", expandable: true },
    { label: "Level", value: "", expandable: true },
    { label: "MOI", value: "", expandable: true },
    { label: "Credits", value: "", expandable: true },
    { label: "Honors", value: "", expandable: true },
    { label: "Foreign Lang", value: "", expandable: true },
    { label: "Session", value: "", expandable: true },
    { label: "Reserved section", value: "", expandable: true },
    { label: "Course Attributes", value: "", expandable: true },
  ];

  const popularTopics = [
    "AI",
    "Machine Learning",
    "Data Science",
    "Web Development",
    "Algorithms",
    "Systems",
  ];

  const toggleFilter = (name: string) => {
    setExpandedFilters((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    if (showComparison) {
      setSelectedCourses((prev) => {
        const next = new Set(prev);
        next.has(course.course_id)
          ? next.delete(course.course_id)
          : next.add(course.course_id);
        return next;
      });
    }
  };

  const displayCourses = aiMode ? recommendations : courses;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {filters.map((f) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <button
                  onClick={() => toggleFilter(f.label)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-full flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {f.label}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 text-gray-600"
                    style={{
                      transform: expandedFilters.has(f.label)
                        ? "rotate(180deg)"
                        : undefined,
                    }}
                  />
                </button>
              </motion.div>
            ))}
          </div>
          {/* User info */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">AT</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Anuraj Triswamy
                </p>
                <p className="text-xs text-gray-600">aditoes@virginia.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
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
              <button className="text-sm text-gray-600 hover:text-gray-800">
                sign out
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white px-8 py-6 border-b border-gray-200">
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you interested in?"
                  className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-lg placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>

              <div className="flex gap-4">
                <select className="px-4 py-2 bg-gray-50 rounded-full text-sm">
                  <option>Term: Fall 2022</option>
                  <option>Term: Spring 2023</option>
                  <option>Term: Fall 2023</option>
                </select>
                <select className="px-4 py-2 bg-gray-50 rounded-full text-sm">
                  <option>Subjects: All</option>
                  <option>Computer Sciences</option>
                  <option>Mathematics</option>
                  <option>Statistics</option>
                </select>
                <input
                  type="text"
                  placeholder="Keyword"
                  className="px-4 py-2 bg-gray-50 rounded-full text-sm flex-1 placeholder-gray-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Popular topics:</span>
                {popularTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSearchQuery(topic)}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-800 rounded-full text-sm transition-colors text-white"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
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
                  <button
                    onClick={() => setGroupByTopic(!groupByTopic)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
                  >
                    Group by topic
                  </button>
                </div>
                {selectedCourses.size > 0 && (
                  <button
                    onClick={() => setShowComparison(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Compare ({selectedCourses.size})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* List */}
            <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
              <p className="text-sm text-gray-900 mb-4 font-medium">
                {aiMode
                  ? "AI recommendations based on your profile"
                  : "Based on your search results"}
              </p>

              <div className="space-y-3">
                {coursesLoading || recsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  displayCourses.map((course) => (
                    <CourseCard
                      key={course.course_id}
                      course={course}
                      selected={
                        selectedCourse?.course_id === course.course_id ||
                        selectedCourses.has(course.course_id)
                      }
                      onSelect={() => handleCourseSelect(course)}
                      showRelevance={aiMode}
                    />
                  ))
                )}
              </div>

              <button className="mt-6 text-blue-700 font-medium flex items-center gap-2 hover:text-blue-800">
                View more
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
              {selectedCourse ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-3xl font-bold text-black mb-2">
                      {selectedCourse.course_code}{" "}
                      {selectedCourse.catalog_number}:{selectedCourse.title}
                    </h2>
                    <p className="text-black">{selectedCourse.description}</p>
                  </div>

                  {aiMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Why we recommended this
                      </h3>
                      <p className="text-blue-800 text-sm">
                        Based on your completed courses in algorithms and data
                        structures, plus your interest in AI, this course aligns
                        with your goals.
                      </p>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-black mb-4">
                      Course Details
                    </h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-800">Credits</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedCourse.credits}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-800">Level</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedCourse.level}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-800">Last Taught</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedCourse.last_taught_term}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-800">College</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedCourse.college}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {selectedCourse.pre_requisites && (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h3 className="font-semibold text-black mb-3">
                        Prerequisites
                      </h3>
                      <p className="text-black">
                        {selectedCourse.pre_requisites}
                      </p>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-black mb-4">
                      Grade Distribution
                    </h3>
                    <GradeDistributionChart
                      courseId={selectedCourse.course_id}
                    />
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      Rate My Professor
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        Coming Soon
                      </span>
                    </h3>
                    <p className="text-black text-sm">
                      Professor ratings and reviews will be available soon.
                    </p>
                  </div>

                  <button
                    disabled
                    className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Check Eligibility (DARS integration coming soon)
                  </button>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-black">
                      Select a course to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function CourseSearchAI() {
  return <CourseSearchAIContent />;
}
