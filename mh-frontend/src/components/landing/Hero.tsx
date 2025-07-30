import { GridBackground } from "@/components/ui/backgrounds";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <GridBackground size={40} />
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
          Course Search AI
        </h1>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-gray-600 dark:text-gray-300 mb-8">
          Your personal engine for perfect classes & research roles.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Get Started
          </button>
          <button className="px-8 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};
