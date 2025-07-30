import { Hero } from "./Hero";
import { FeatureGrid } from "./FeatureGrid";
import { HowItWorks } from "./HowItWorks";
import { ResumeDrop } from "./ResumeDrop";
import { RASection } from "./RASection";
import { CTA } from "./CTA";
import { Footer } from "./Footer";

export const CourseSearchLanding = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <ResumeDrop />
      <RASection />
      <CTA />
      <Footer />
    </div>
  );
};
