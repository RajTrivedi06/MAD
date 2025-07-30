"use client";

import { DotBackground } from "@/components/ui/backgrounds";
import { DirectionAwareHover } from "@/components/ui/direction-aware-hover";

export const RASection = () => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <DotBackground size={20} />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Research Assistant Matchmaking
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find the perfect research opportunities that match your skills and
            interests.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <DirectionAwareHover imageUrl="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop">
              <p className="font-bold text-xl">Explore Labs →</p>
              <p className="font-normal text-sm">$0 / free</p>
            </DirectionAwareHover>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI-Powered Research Matching
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our advanced algorithm matches you with research opportunities
              based on your academic profile, skills, and preferences.
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Matches labs to your skills & grades
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Prioritises professors you prefer
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Works even if you leave filters blank
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                Gives explanation for each suggestion
              </li>
            </ul>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Explore Research Opportunities
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
