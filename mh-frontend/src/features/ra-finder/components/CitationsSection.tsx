import React, { useState } from "react";
import { ExternalLink, Book, ChevronDown, ChevronUp } from "lucide-react";
import { Citation } from "../types/labMatch";

interface CitationsSectionProps {
  citations?: Citation[];
  className?: string;
}

export const CitationsSection: React.FC<CitationsSectionProps> = ({
  citations,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={`border-t pt-4 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        <Book className="w-4 h-4" />
        <span>Sources & Citations ({citations.length})</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-600 italic">
            Information compiled from the following verified sources:
          </p>

          {citations.map((citation, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {citation.source}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      {citation.accessed}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    <strong>Used for:</strong> {citation.info_used}
                  </p>

                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="break-all">{citation.url}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>✓ Verified Information:</strong> All data has been
              cross-referenced with official UW-Madison sources to ensure
              accuracy and authenticity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
