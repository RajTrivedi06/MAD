import {
  Card,
  CardTitle,
  CardDescription,
  CardSkeletonContainer,
} from "@/components/ui/card";

export const HowItWorks = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Three simple steps to find your perfect courses and research
            opportunities.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <Card className="max-w-sm">
            <CardSkeletonContainer>
              <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            </CardSkeletonContainer>
            <div className="p-6">
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>
                Simply upload your resume in PDF format and our AI will extract
                your skills, experience, and academic background.
              </CardDescription>
            </div>
          </Card>

          <Card className="max-w-sm">
            <CardSkeletonContainer>
              <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            </CardSkeletonContainer>
            <div className="p-6">
              <CardTitle>Parse & Embed</CardTitle>
              <CardDescription>
                Our AI embeds your resume into a high-dimensional vector space
                for intelligent matching with courses and research positions.
              </CardDescription>
            </div>
          </Card>

          <Card className="max-w-sm">
            <CardSkeletonContainer>
              <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            </CardSkeletonContainer>
            <div className="p-6">
              <CardTitle>Rank & Recommend</CardTitle>
              <CardDescription>
                Get personalized course recommendations and research assistant
                opportunities ranked by relevance and fit.
              </CardDescription>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
