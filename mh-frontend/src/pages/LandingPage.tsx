import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Brain,
  FileText,
  Database,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Mail,
  ArrowRight,
  Sparkles,
  GraduationCap,
  FlaskConical,
  UserPlus,
} from "lucide-react";
import { LineShadowText } from "@/components/ui/line-shadow-text";
import { BoxReveal } from "@/components/ui/box-reveal";

const MadHelpLanding = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  };

  // Hero Section
  const Hero = () => (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 text-center max-w-5xl mx-auto px-6"
      >
        <motion.div
          variants={fadeIn}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Course Discovery for UW Madison
        </motion.div>

        <motion.h1
          variants={fadeIn}
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-6"
        >
          Mad
          <LineShadowText className="text-red-600 italic" shadowColor="#dc2626">
            Help
          </LineShadowText>
        </motion.h1>

        <motion.p
          variants={fadeIn}
          className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
        >
          Your intelligent companion for course selection, research
          opportunities, and academic connections at UW Madison
        </motion.p>

        <motion.div
          variants={fadeIn}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-red-600 text-white rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors"
          >
            Get Started
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );

  // Features Section
  const Features = () => {
    const features = [
      {
        icon: <Brain className="w-8 h-8" />,
        title: "Course Search AI",
        description:
          "Personalized recommendations based on your academic history, skills, and interests",
        highlight: true,
      },
      {
        icon: <FlaskConical className="w-8 h-8" />,
        title: "RA Matchmaking",
        description:
          "Find research opportunities that align with your background and goals",
        highlight: true,
      },
      {
        icon: <Users className="w-8 h-8" />,
        title: "Study Groups",
        description:
          "Connect with classmates who share your courses and interests",
        badge: "Coming Soon",
      },
      {
        icon: <Database className="w-8 h-8" />,
        title: "DARS Integration",
        description:
          "Seamlessly syncs with your degree progress and requirements",
      },
      {
        icon: <FileText className="w-8 h-8" />,
        title: "Resume Parsing",
        description:
          "Extracts skills and experience to enhance recommendations",
      },
      {
        icon: <TrendingUp className="w-8 h-8" />,
        title: "Grade Insights",
        description: "MadGrades data integrated for informed decision making",
      },
    ];

    return (
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeIn}
              className="text-4xl md:text-5xl font-bold text-black mb-4"
            >
              Powerful Features for Badgers
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Everything you need to navigate your academic journey at UW
              Madison
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -8 }}
                className={`relative p-8 bg-white rounded-2xl ${
                  feature.highlight
                    ? "border-2 border-red-600"
                    : "border border-gray-200"
                } hover:shadow-xl transition-all`}
              >
                {feature.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 bg-black text-white text-sm rounded-full">
                    {feature.badge}
                  </span>
                )}
                <div
                  className={`inline-flex p-3 rounded-lg ${
                    feature.highlight
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-100 text-gray-700"
                  } mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  };

  // How It Works Section
  const HowItWorks = () => {
    const steps = [
      {
        number: "01",
        title: "Upload Your Info",
        description:
          "Connect your DARS and upload your resume for personalized insights",
        icon: <FileText className="w-6 h-6" />,
      },
      {
        number: "02",
        title: "AI Analysis",
        description:
          "Our AI analyzes your profile, skills, and academic progress",
        icon: <Brain className="w-6 h-6" />,
      },
      {
        number: "03",
        title: "Get Recommendations",
        description:
          "Receive tailored course suggestions and research opportunities",
        icon: <Sparkles className="w-6 h-6" />,
      },
    ];

    return (
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeIn}
              className="text-4xl md:text-5xl font-bold text-black mb-4"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Three simple steps to transform your academic planning
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-red-50 text-red-600 rounded-full mb-6"
                >
                  {step.icon}
                </motion.div>
                <div className="text-5xl font-bold text-gray-200 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-black mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // RA Feature Section
  const RAFeature = () => (
    <section className="py-24 px-6 bg-black text-white relative overflow-hidden">
      {/* Animated dots background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <BoxReveal boxColor="#dc2626" duration={0.6}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium mb-6">
                <FlaskConical className="w-4 h-4" />
                Research Assistant Matchmaking
              </div>
            </BoxReveal>

            <BoxReveal boxColor="#dc2626" duration={0.6}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Find Your Perfect Research Match
              </h2>
            </BoxReveal>

            <BoxReveal boxColor="#dc2626" duration={0.6}>
              <p className="text-lg text-gray-300 mb-8">
                Our AI-powered engine matches you with research opportunities
                based on your skills, coursework, and interests.
              </p>
            </BoxReveal>

            <div className="space-y-4 mb-8">
              {[
                "Matches based on your academic background and skills",
                "Discovers opportunities across all departments",
                "Generates personalized outreach templates",
                "Works even without specific preferences",
              ].map((item, index) => (
                <BoxReveal key={index} boxColor="#dc2626" duration={0.6}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                </BoxReveal>
              ))}
            </div>

            <BoxReveal boxColor="#dc2626" duration={0.6}>
              <button className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-2">
                Explore Research Opportunities
                <ArrowRight className="w-4 h-4" />
              </button>
            </BoxReveal>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Dr. Smith&apos;s AI Lab</h3>
                  <p className="text-gray-400">Computer Sciences</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                Match Score: <span className="text-red-600 font-bold">95%</span>
              </p>
              <p className="text-sm text-gray-400">
                &quot;Perfect match! You&apos;ve completed ML and NLP courses
                with strong grades and have Python experience...&quot;
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  // CTA Section
  const CTA = () => (
    <section className="py-24 px-6 bg-red-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px]" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <motion.h2
          variants={fadeIn}
          className="text-4xl md:text-5xl font-bold mb-6"
        >
          Ready to Transform Your Academic Journey?
        </motion.h2>
        <motion.p variants={fadeIn} className="text-xl mb-8 text-red-100">
          Join fellow Badgers using AI to make smarter academic decisions
        </motion.p>
        <motion.div
          variants={fadeIn}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-red-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Sign Up Free
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg font-semibold text-lg hover:bg-white hover:text-red-600 transition-colors"
          >
            Try It Out
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );

  // Footer

  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <HowItWorks />
      <RAFeature />
      <CTA />
    </div>
  );
};

export function LandingPage() {
  return <MadHelpLanding />;
}
