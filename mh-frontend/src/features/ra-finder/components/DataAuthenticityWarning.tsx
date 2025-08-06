import { AlertTriangle, ExternalLink } from "lucide-react";

interface DataAuthenticityWarningProps {
  labCount: number;
  hasUnverifiedData: boolean;
  validationRate?: number;
}

export function DataAuthenticityWarning({
  labCount,
  hasUnverifiedData,
  validationRate,
}: DataAuthenticityWarningProps) {
  if (!hasUnverifiedData) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-2">
            Data Verification Warning
          </h3>
          <p className="text-sm text-red-700 mb-2">
            Some results may not be fully verified. We&apos;re working on
            implementing real-time web search to ensure all lab information is
            current and accurate.
          </p>
          {validationRate !== undefined && (
            <p className="text-sm text-red-700 mb-2">
              Validation Rate: {validationRate.toFixed(1)}% of labs have
              verified UW-Madison sources.
            </p>
          )}
          <p className="text-sm text-red-700 mb-3">
            Please verify all information directly on lab websites before
            contacting professors.
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href="https://grad.wisc.edu/research/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-red-800 underline hover:text-red-900 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              UW-Madison Graduate Research
            </a>
            <a
              href="https://www.cs.wisc.edu/research/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-red-800 underline hover:text-red-900 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              CS Department Research
            </a>
            <a
              href="https://engineering.wisc.edu/research/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-red-800 underline hover:text-red-900 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Engineering Research
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
