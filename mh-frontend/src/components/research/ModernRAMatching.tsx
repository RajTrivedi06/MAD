"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Sparkles,
  Filter,
  FlaskConical,
  Clock,
  Users,
  Star,
  ChevronRight,
  Brain,
  Zap,
  Target,
  TrendingUp,
  Award,
  MapPin,
  Calendar,
  DollarSign,
  Bookmark,
  Share,
  Eye,
  ArrowRight,
  Lightbulb,
  Cpu,
  Wand2,
  Microscope,
  TestTube,
  GraduationCap,
  Briefcase,
  Globe,
  Database,
  Code,
  BarChart3,
  PieChart,
  Beaker,
  Atom,
  Dna,
  Telescope,
  BookOpen,
} from "lucide-react";

interface ResearchOpportunity {
  id: string;
  title: string;
  department: string;
  professor: string;
  description: string;
  duration: string;
  stipend: string;
  hoursPerWeek: number;
  startDate: string;
  endDate: string;
  location: string;
  requirements: string[];
  skills: string[];
  tags: string[];
  aiMatch: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  type:
    | "Lab Research"
    | "Data Analysis"
    | "Field Work"
    | "Computational"
    | "Literature Review";
  status: "Open" | "Filled" | "Urgent";
  applications: number;
  maxPositions: number;
  researchAreas: string[];
  publications: number;
  funding: string;
}

const sampleOpportunities: ResearchOpportunity[] = [
  {
    id: "1",
    title: "Machine Learning for Drug Discovery",
    department: "Computer Science",
    professor: "Dr. Sarah Chen",
    description:
      "Develop novel machine learning algorithms to predict drug-protein interactions and accelerate pharmaceutical discovery. Work with large-scale molecular datasets and cutting-edge AI models.",
    duration: "12 months",
    stipend: "$3,500/month",
    hoursPerWeek: 20,
    startDate: "Fall 2024",
    endDate: "Summer 2025",
    location: "Computer Science Building, Lab 302",
    requirements: [
      "Python",
      "Machine Learning",
      "Chemistry basics",
      "Statistics",
    ],
    skills: ["Deep Learning", "PyTorch", "Bioinformatics", "Data Analysis"],
    tags: [
      "AI/ML",
      "Drug Discovery",
      "Bioinformatics",
      "Deep Learning",
      "Pharmaceutical",
    ],
    aiMatch: 96,
    difficulty: "Advanced",
    type: "Computational",
    status: "Open",
    applications: 8,
    maxPositions: 2,
    researchAreas: [
      "Artificial Intelligence",
      "Drug Discovery",
      "Bioinformatics",
    ],
    publications: 15,
    funding: "NIH Grant",
  },
  {
    id: "2",
    title: "Climate Change Impact on Urban Ecosystems",
    department: "Environmental Science",
    professor: "Dr. Michael Rodriguez",
    description:
      "Study the effects of climate change on urban biodiversity and ecosystem services. Conduct field research, data collection, and statistical analysis of environmental data.",
    duration: "8 months",
    stipend: "$2,800/month",
    hoursPerWeek: 15,
    startDate: "Spring 2025",
    endDate: "Fall 2025",
    location: "Environmental Science Center",
    requirements: ["Ecology", "Statistics", "Field work experience", "GIS"],
    skills: [
      "Data Collection",
      "Statistical Analysis",
      "GIS Mapping",
      "Field Research",
    ],
    tags: [
      "Climate Change",
      "Ecology",
      "Urban Studies",
      "Field Work",
      "Environmental",
    ],
    aiMatch: 89,
    difficulty: "Intermediate",
    type: "Field Work",
    status: "Urgent",
    applications: 12,
    maxPositions: 3,
    researchAreas: [
      "Climate Science",
      "Urban Ecology",
      "Environmental Studies",
    ],
    publications: 8,
    funding: "NSF Grant",
  },
  {
    id: "3",
    title: "Quantum Computing Algorithms for Optimization",
    department: "Physics",
    professor: "Dr. Emily Williams",
    description:
      "Research quantum algorithms for solving complex optimization problems. Develop quantum circuits and analyze their performance on quantum simulators.",
    duration: "10 months",
    stipend: "$4,200/month",
    hoursPerWeek: 25,
    startDate: "Summer 2025",
    endDate: "Spring 2026",
    location: "Quantum Computing Lab",
    requirements: [
      "Quantum Mechanics",
      "Linear Algebra",
      "Programming",
      "Physics",
    ],
    skills: [
      "Quantum Computing",
      "Qiskit",
      "Algorithm Design",
      "Mathematical Modeling",
    ],
    tags: [
      "Quantum Computing",
      "Algorithms",
      "Physics",
      "Optimization",
      "Research",
    ],
    aiMatch: 92,
    difficulty: "Advanced",
    type: "Computational",
    status: "Open",
    applications: 5,
    maxPositions: 1,
    researchAreas: ["Quantum Physics", "Computer Science", "Mathematics"],
    publications: 22,
    funding: "DOE Grant",
  },
];

const aiSuggestions = [
  "Machine learning research",
  "Environmental field work",
  "Quantum computing algorithms",
  "Biomedical data analysis",
  "Social science surveys",
  "Computer vision projects",
];

const researchTypes = [
  {
    name: "Lab Research",
    icon: FlaskConical,
    color: "from-red-500 to-red-600",
  },
  {
    name: "Data Analysis",
    icon: BarChart3,
    color: "from-red-600 to-red-700",
  },
  { name: "Field Work", icon: MapPin, color: "from-red-700 to-red-800" },
  { name: "Computational", icon: Cpu, color: "from-red-800 to-red-900" },
  {
    name: "Literature Review",
    icon: BookOpen,
    color: "from-red-900 to-red-950",
  },
];

export default function ModernRAMatching() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState(sampleOpportunities);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<ResearchOpportunity | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { name: "AI/ML", color: "from-red-500 to-red-600" },
    { name: "Environmental", color: "from-red-600 to-red-700" },
    { name: "Physics", color: "from-red-700 to-red-800" },
    { name: "Biology", color: "from-red-800 to-red-900" },
    { name: "Computer Science", color: "from-red-900 to-red-950" },
    { name: "Beginner", color: "from-red-400 to-red-500" },
    { name: "Advanced", color: "from-red-600 to-red-700" },
    { name: "Urgent", color: "from-red-500 to-red-600" },
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    setAiThinking(true);

    // Simulate AI processing
    setTimeout(() => {
      setAiThinking(false);
      setAiInsight(
        `Based on your search for "${searchQuery}", I've analyzed 856 research opportunities and found these perfect matches considering your academic background, research interests, and career goals.`
      );

      const filtered = sampleOpportunities.filter(
        (opp) =>
          opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          opp.researchAreas.some((area) =>
            area.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setOpportunities(filtered);
      setIsSearching(false);
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    searchInputRef.current?.focus();
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const getMatchColor = (match: number) => {
    if (match >= 95) return "text-red-400 bg-red-500/20 border-red-500/30";
    if (match >= 90) return "text-red-500 bg-red-500/20 border-red-500/30";
    if (match >= 80) return "text-red-600 bg-red-500/20 border-red-500/30";
    return "text-gray-400 bg-gray-500/20 border-gray-500/30";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "text-red-400 bg-red-500/20";
      case "Intermediate":
        return "text-red-500 bg-red-500/20";
      case "Advanced":
        return "text-red-600 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "text-red-400 bg-red-500/20";
      case "Urgent":
        return "text-red-500 bg-red-500/20";
      case "Filled":
        return "text-gray-400 bg-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Lab Research":
        return <FlaskConical className="w-4 h-4" />;
      case "Data Analysis":
        return <BarChart3 className="w-4 h-4" />;
      case "Field Work":
        return <MapPin className="w-4 h-4" />;
      case "Computational":
        return <Cpu className="w-4 h-4" />;
      case "Literature Review":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FlaskConical className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900/20 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>

      <div className="relative px-4 py-8 max-w-7xl mx-auto">
        {/* Hero Search Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-full px-4 py-2 mb-6">
            <Brain className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm font-medium">
              AI-Powered Research Matching
            </span>
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-red-200 to-red-300 bg-clip-text text-transparent mb-4">
            Discover Research
            <br />
            <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
              Opportunities
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with cutting-edge research projects that match your
            interests, skills, and career aspirations through our intelligent
            matching system.
          </p>
        </div>

        {/* Search Interface */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Describe your research interests..."
                    className="w-full pl-16 pr-6 py-6 bg-transparent text-white placeholder-gray-400 text-lg focus:outline-none"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white px-8 py-6 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 group/btn"
                >
                  {isSearching ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-300" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          {!searchQuery && (
            <div className="mt-6">
              <div className="text-gray-400 text-sm mb-3">
                Try searching for:
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-xl text-gray-300 hover:text-white transition-all duration-300 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Thinking Animation */}
        {aiThinking && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Brain className="w-8 h-8 text-red-400 animate-pulse" />
                  <div className="absolute inset-0 bg-red-400/20 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    AI is analyzing your research profile...
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Matching skills, interests, and career goals with available
                    opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        {aiInsight && !aiThinking && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    AI Research Match Insight
                  </h3>
                  <p className="text-gray-300">{aiInsight}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Research Type Categories */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {researchTypes.map((type) => (
              <button
                key={type.name}
                className="group relative bg-white/5 backdrop-blur-sm border border-red-500/20 hover:border-red-500/40 rounded-2xl p-6 transition-all duration-300 hover:bg-red-500/10"
              >
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${type.color} rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-medium text-sm">
                    {type.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors duration-300"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? "Hide" : "Show"} Filters</span>
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => toggleFilter(filter.name)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selectedFilters.includes(filter.name)
                        ? `bg-gradient-to-r ${filter.color} text-white shadow-lg`
                        : "bg-white/10 text-gray-300 hover:bg-red-500/10 hover:text-white border border-red-500/20"
                    }`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Research Opportunities */}
        <div className="max-w-6xl mx-auto space-y-6">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="group relative bg-white/5 backdrop-blur-sm border border-red-500/20 hover:border-red-500/40 rounded-3xl p-8 transition-all duration-500 hover:bg-red-500/10"
            >
              {/* Opportunity Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-xl text-sm font-semibold">
                      {opportunity.department}
                    </span>
                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getMatchColor(
                        opportunity.aiMatch
                      )}`}
                    >
                      {opportunity.aiMatch}% Match
                    </div>
                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-semibold ${getStatusColor(
                        opportunity.status
                      )}`}
                    >
                      {opportunity.status}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-red-400" />
                      <span className="text-white font-medium">
                        {opportunity.applications}
                      </span>
                      <span className="text-gray-400 text-sm">
                        applications
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-red-300 transition-colors duration-300">
                    {opportunity.title}
                  </h3>
                  <p className="text-gray-300 text-lg mb-4 leading-relaxed">
                    {opportunity.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {opportunity.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-red-500/10 text-gray-300 rounded-lg text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Opportunity Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-red-400" />
                      <div>
                        <div className="text-white font-medium">
                          {opportunity.duration}
                        </div>
                        <div className="text-gray-400 text-sm">Duration</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="text-white font-medium">
                          {opportunity.stipend}
                        </div>
                        <div className="text-gray-400 text-sm">Stipend</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="text-white font-medium">
                          {opportunity.hoursPerWeek}h/week
                        </div>
                        <div className="text-gray-400 text-sm">
                          Time Commitment
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getTypeIcon(opportunity.type)}
                      <div>
                        <div className="text-white font-medium">
                          {opportunity.type}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Research Type
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3">
                  <div
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${getDifficultyColor(
                      opportunity.difficulty
                    )}`}
                  >
                    {opportunity.difficulty}
                  </div>

                  <button className="p-3 bg-white/10 hover:bg-red-500/10 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group/btn">
                    <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* Professor & Requirements */}
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-red-500/20">
                <div>
                  <h4 className="text-white font-semibold mb-2">
                    Principal Investigator
                  </h4>
                  <p className="text-gray-300 mb-2">{opportunity.professor}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{opportunity.publications} publications</span>
                    <span>{opportunity.funding}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.requirements.slice(0, 3).map((req, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-500/10 text-gray-300 rounded text-xs"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results State */}
        {opportunities.length === 0 && searchQuery && !isSearching && (
          <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-3xl p-12 max-w-md mx-auto">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">
                No opportunities found
              </h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search terms or explore our suggestions
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
