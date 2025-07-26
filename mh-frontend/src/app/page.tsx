"use client";

import { motion } from "motion/react";
import React from "react";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { cn } from "@/lib/utils";
import {
  Brain,
  BookOpen,
  FlaskConical,
  Target,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Search,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  GraduationCap,
  Cpu,
  MessageCircle,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

// Hero Section with Gradient Background
function HeroSection() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-red-900 to-black flex items-center justify-center">
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          whileInView={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-red-500/20 rounded-full px-6 py-3 mb-4"
        >
          <GraduationCap className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm font-medium">
            AI-Powered Academic Assistant
          </span>
        </motion.div>

        <div className="text-4xl md:text-7xl font-bold text-center bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent drop-shadow-lg">
          Your Academic Journey,
          <br />
          <span className="bg-gradient-to-r from-red-300 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
            Intelligently Guided
          </span>
        </div>

        <div className="font-light text-lg md:text-2xl text-white py-4 max-w-3xl text-center drop-shadow-lg">
          MAD transforms your academic experience with AI-powered course
          recommendations, research opportunities, and personalized learning
          paths tailored just for you.
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Link href="/auth">
            <button className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-2">
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </Link>

          <button className="border border-red-500/30 hover:border-red-500/50 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-red-500/10 transition-all duration-300 backdrop-blur-sm">
            Watch Demo
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="flex items-center space-x-6 mt-12 text-gray-300"
        >
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white/20"
                ></div>
              ))}
            </div>
            <span className="text-sm">10,000+ Students</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm">4.9/5 Rating</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Feature Skeletons for Bento Grid
const AISearchSkeleton = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-3 p-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="w-6 h-6 text-red-400" />
        <div className="h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full w-24"></div>
      </div>

      <motion.div
        className="flex flex-col space-y-2"
        initial={{ x: -20 }}
        whileInView={{ x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
          "Find courses in machine learning"
        </div>
        <div className="bg-red-600/20 backdrop-blur-sm border border-red-600/30 rounded-xl p-3 text-red-300 text-sm ml-auto">
          Found 12 perfect matches! 🎯
        </div>
      </motion.div>
    </motion.div>
  );
};

const ResearchMatchingSkeleton = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-3 p-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-2">
        <FlaskConical className="w-6 h-6 text-red-500" />
        <div className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
          96% Match
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-full w-full"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-full w-3/4"></div>
        <div className="flex space-x-2 mt-3">
          <div className="h-6 bg-red-500/30 rounded-lg flex-1"></div>
          <div className="h-6 bg-red-600/30 rounded-lg flex-1"></div>
        </div>
      </div>
    </motion.div>
  );
};

const ProgressTrackingSkeleton = () => {
  const progress = [60, 80, 45, 90];

  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-3 p-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-6 h-6 text-red-400" />
        <span className="text-sm text-gray-300">Academic Progress</span>
      </div>

      <div className="space-y-3">
        {progress.map((value, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Course {i + 1}</span>
              <span>{value}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${value}%` }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const SmartCalendarSkeleton = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col p-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-6 h-6 text-red-500" />
        <span className="text-sm text-gray-300">Smart Schedule</span>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
          <div key={day} className="text-xs text-gray-400 text-center p-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }, (_, i) => (
          <motion.div
            key={i}
            className={`aspect-square rounded-md ${
              [3, 8, 12, 16].includes(i)
                ? "bg-gradient-to-br from-red-500 to-red-600"
                : i % 7 === 0 || i % 7 === 6
                ? "bg-gray-800"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

const PersonalizationSkeleton = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-4 p-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2">
        <Target className="w-6 h-6 text-red-400" />
        <span className="text-sm text-gray-300">Personal Learning Path</span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-full w-full mb-2"></div>
          <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full w-2/3"></div>
        </div>
      </div>

      <div className="flex space-x-2">
        {["ML", "AI", "DS"].map((tag, i) => (
          <motion.div
            key={tag}
            className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-full text-xs text-red-300"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            {tag}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const CollaborationSkeleton = () => {
  return (
    <motion.div
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-4 p-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2">
        <Users className="w-6 h-6 text-red-400" />
        <span className="text-sm text-gray-300">Study Groups</span>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="flex items-center space-x-3"
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full w-3/4 mb-1"></div>
              <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full w-1/2"></div>
            </div>
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Features Bento Grid
const features = [
  {
    title: "AI-Powered Course Search",
    description:
      "Discover perfect courses with intelligent recommendations based on your academic goals, learning style, and career aspirations.",
    header: <AISearchSkeleton />,
    className: "md:col-span-2",
    icon: <Brain className="h-4 w-4 text-red-500" />,
  },
  {
    title: "Research Opportunity Matching",
    description:
      "Connect with cutting-edge research projects that align with your interests and skill level.",
    header: <ResearchMatchingSkeleton />,
    className: "md:col-span-1",
    icon: <FlaskConical className="h-4 w-4 text-red-600" />,
  },
  {
    title: "Academic Progress Tracking",
    description:
      "Monitor your degree progress with detailed analytics and milestone tracking.",
    header: <ProgressTrackingSkeleton />,
    className: "md:col-span-1",
    icon: <BarChart3 className="h-4 w-4 text-red-500" />,
  },
  {
    title: "Smart Schedule Management",
    description:
      "Optimize your academic calendar with AI-driven scheduling and deadline management.",
    header: <SmartCalendarSkeleton />,
    className: "md:col-span-1",
    icon: <Calendar className="h-4 w-4 text-red-600" />,
  },
  {
    title: "Personalized Learning Paths",
    description:
      "Get customized academic roadmaps that adapt to your progress and changing interests.",
    header: <PersonalizationSkeleton />,
    className: "md:col-span-2",
    icon: <Target className="h-4 w-4 text-red-500" />,
  },
  {
    title: "Collaborative Study Groups",
    description:
      "Find and join study groups with peers who share your academic interests and goals.",
    header: <CollaborationSkeleton />,
    className: "md:col-span-1",
    icon: <Users className="h-4 w-4 text-red-600" />,
  },
];

function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-black via-red-900/10 to-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent mb-6 drop-shadow-lg">
            Intelligent Features for
            <br />
            <span className="bg-gradient-to-r from-red-300 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
              Academic Excellence
            </span>
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto drop-shadow-sm">
            MAD combines cutting-edge AI with intuitive design to create the
            ultimate academic companion. Every feature is designed to accelerate
            your learning journey.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[18rem]">
            {features.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                className={cn("[&>p:text-lg]", item.className)}
                icon={item.icon}
              />
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
}

// Statistics Section
function StatsSection() {
  const stats = [
    { number: "10K+", label: "Active Students", icon: Users },
    { number: "500+", label: "Research Projects", icon: FlaskConical },
    { number: "50K+", label: "Course Matches", icon: BookOpen },
    { number: "98%", label: "Satisfaction Rate", icon: Star },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-black via-red-900/20 to-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by Students Worldwide
          </h2>
          <p className="text-xl text-gray-300">
            Join thousands of students who have transformed their academic
            journey with MAD
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-4">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-black to-black">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent mb-6 drop-shadow-lg">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-red-300 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
              Academic Journey?
            </span>
          </h2>

          <p className="text-xl text-gray-200 mb-12 max-w-2xl mx-auto drop-shadow-sm">
            Join MAD today and experience the future of academic assistance.
            Your personalized learning adventure starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <motion.button
                className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-6 text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-red-400" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-red-400" />
              <span>No credit card required</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Main Landing Page Component
export default function Page() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </div>
  );
}
