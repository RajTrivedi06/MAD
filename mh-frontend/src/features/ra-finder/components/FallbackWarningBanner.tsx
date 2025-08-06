import React, { useState } from "react";
import { AlertTriangle, X, Info, ExternalLink } from "lucide-react";

interface FallbackWarningBannerProps {
  isVisible: boolean;
  fallbackReason?: string | null;
  modelUsed?: string | null;
  className?: string;
}

export const FallbackWarningBanner: React.FC<FallbackWarningBannerProps> = ({
  isVisible,
  fallbackReason,
  modelUsed,
  className = "",
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isVisible || isDismissed) {
    return null;
  }

  // Determine which model failed and which was used as fallback
  const primaryModel = "o4-mini-deep-research";
  const fallbackModel = modelUsed || "GPT-4o";

  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-800">
              {primaryModel} Unavailable
            </h3>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-amber-600 hover:text-amber-800 transition-colors"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-amber-700 mt-1">
            OpenAI&apos;s advanced {primaryModel} model is currently
            unavailable. Results have been generated using{" "}
            <strong>{fallbackModel}</strong> as a fallback, which provides
            alternative research lab recommendations.
          </p>

          {fallbackReason && (
            <details className="mt-2">
              <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">
                Technical Details
              </summary>
              <p className="text-xs text-amber-600 mt-1 font-mono bg-amber-100 p-2 rounded">
                {fallbackReason}
              </p>
            </details>
          )}

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <Info className="w-3 h-3" />
              <span>
                {fallbackModel === "none" || fallbackModel === "fallback-mock"
                  ? "Unable to perform real-time search. Please check department websites directly."
                  : "Results are based on AI knowledge without real-time web search capability"}
              </span>
            </div>

            <a
              href="https://platform.openai.com/docs/guides/deep-research"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Learn about deep research models
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
