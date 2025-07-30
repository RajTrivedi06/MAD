import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconClipboardCopy,
  IconDatabase,
  IconSearch,
  IconLayersOff,
  IconCheck,
  IconRefresh,
  IconSpy,
} from "@tabler/icons-react";

const features = [
  {
    title: "Resume Parsing",
    description:
      "Extracts skills and experience from your resume automatically.",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "DARS Sync",
    description: "Reads your academic progress and completed courses.",
    icon: <IconDatabase className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Semantic Search",
    description: "Meaning-aware matching using advanced AI algorithms.",
    icon: <IconSearch className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Clustering",
    description: "Groups related courses and topics for better organization.",
    icon: <IconLayersOff className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Eligibility Check",
    description: "Automatically checks prerequisites and requirements.",
    icon: <IconCheck className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Feedback Loop",
    description: "Learns from your preferences and improves recommendations.",
    icon: <IconRefresh className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Catalog Sync",
    description: "Real-time course catalog updates and availability.",
    icon: <IconSpy className="h-4 w-4 text-neutral-500" />,
  },
];

export const FeatureGrid = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our AI-powered platform combines multiple technologies to deliver
            the perfect course matches.
          </p>
        </div>
        <BentoGrid className="max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <BentoGridItem
              key={i}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              className={i === 3 || i === 6 ? "md:col-span-2" : ""}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
};
