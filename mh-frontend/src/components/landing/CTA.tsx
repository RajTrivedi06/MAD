import { GridSmallBackground } from "@/components/ui/backgrounds";

export const CTA = () => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <GridSmallBackground size={20} />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Ready to search smarter?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of students who are already finding their perfect
          courses and research opportunities with AI.
        </p>
        <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg">
          Get Started
        </button>
      </div>
    </section>
  );
};
