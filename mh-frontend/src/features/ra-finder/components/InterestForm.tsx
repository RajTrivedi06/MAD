import { Search, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InterestFormProps {
  interests: string;
  onInterestsChange: (value: string) => void;
  onSearch: (useProfile: boolean) => void;
  loading: boolean;
  className?: string;
}

export function InterestForm({
  interests,
  onInterestsChange,
  onSearch,
  loading,
  className,
}: InterestFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interests.trim()) onSearch(true); // Use AI search instead of mock data
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className || ""}`}>
      <div>
        <label
          htmlFor="interests"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Research Interests
        </label>
        <div className="flex gap-3">
          <Input
            id="interests"
            placeholder="Enter research interests (e.g., machine learning, genomics, climate change)"
            value={interests}
            onChange={(e) => onInterestsChange(e.target.value)}
            disabled={loading}
            className="flex-1 h-12 text-base"
          />
          <Button
            type="submit"
            disabled={loading || !interests.trim()}
            className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            <Search className="w-5 h-5 mr-2" />
            AI-Powered Search
          </Button>
        </div>
        <p className="mt-2 text-sm text-gray-600 flex items-start gap-1">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Enter multiple interests separated by commas for better matches
          </span>
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">
            or get comprehensive profile analysis
          </span>
        </div>
      </div>

      <div className="text-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSearch(true)}
          disabled={loading}
          className="h-12 px-8 border-2 border-red-600 text-red-600 hover:bg-red-50 font-medium"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Get AI Recommendations from My Profile
        </Button>
        <p className="mt-2 text-sm text-gray-600">
          Deep analysis of your CV, DARS, and profile for highly personalized
          matches
        </p>
      </div>
    </form>
  );
}
