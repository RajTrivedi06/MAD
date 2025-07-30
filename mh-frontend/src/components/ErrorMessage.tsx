import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
}

export default function ErrorMessage({
  error,
  onRetry,
  title = "Something went wrong",
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 max-w-md">
          {error.message ||
            "An unexpected error occurred while loading the data."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
