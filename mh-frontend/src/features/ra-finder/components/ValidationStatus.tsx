import React from "react";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { LabMatch } from "../types/labMatch";

interface ValidationStatusProps {
  labs: LabMatch[];
  className?: string;
}

export const ValidationStatus: React.FC<ValidationStatusProps> = ({
  labs,
  className = "",
}) => {
  if (labs.length === 0) {
    return null;
  }

  // Calculate validation metrics
  const totalLabs = labs.length;
  const labsWithCitations = labs.filter(
    (lab) => lab.citations && lab.citations.length > 0
  ).length;
  const labsWithWiscEduSources = labs.filter((lab) =>
    lab.citations?.some((citation) => citation.url?.includes("wisc.edu"))
  ).length;
  const labsWithValidEmails = labs.filter((lab) => {
    if (!lab.contactEmail) return true; // Skip if no email
    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(wisc\.edu|wisconsin\.edu)$/;
    return emailPattern.test(lab.contactEmail);
  }).length;

  const validationRate =
    totalLabs > 0 ? (labsWithWiscEduSources / totalLabs) * 100 : 0;
  const isAuthentic = validationRate >= 80;

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        {isAuthentic ? (
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Data Authenticity Verification
            </h3>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">
                {isAuthentic ? "Verified" : "Partial Verification"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{totalLabs}</div>
              <div className="text-gray-600">Total Labs</div>
            </div>

            <div className="text-center">
              <div
                className={`font-semibold ${
                  labsWithCitations === totalLabs
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {labsWithCitations}/{totalLabs}
              </div>
              <div className="text-gray-600">With Citations</div>
            </div>

            <div className="text-center">
              <div
                className={`font-semibold ${
                  labsWithWiscEduSources === totalLabs
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {labsWithWiscEduSources}/{totalLabs}
              </div>
              <div className="text-gray-600">UW Sources</div>
            </div>

            <div className="text-center">
              <div
                className={`font-semibold ${
                  labsWithValidEmails === totalLabs
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {labsWithValidEmails}/{totalLabs}
              </div>
              <div className="text-gray-600">Valid Emails</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Info className="w-3 h-3" />
              <span>
                {isAuthentic
                  ? "All labs have been verified with UW-Madison sources"
                  : "Some labs may need additional verification"}
              </span>
            </div>
          </div>

          {!isAuthentic && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Verification Notice</span>
              </div>
              <p>
                Some labs may not have complete UW-Madison source verification.
                Please check individual lab citations for source details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
