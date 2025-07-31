import {
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LearningResource, RelatedResearch } from "../types/labMatch";

interface LearningResourcesPanelProps {
  resources?: LearningResource[];
  relatedResearch?: RelatedResearch[];
  approachTips?: string[];
}

export function LearningResourcesPanel({
  resources = [],
  relatedResearch = [],
  approachTips = [],
}: LearningResourcesPanelProps) {
  const getResourceIcon = (type: LearningResource["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "article":
        return <FileText className="w-4 h-4" />;
      case "course":
        return <GraduationCap className="w-4 h-4" />;
      case "paper":
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getResourceColor = (type: LearningResource["type"]) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-700 border-red-200";
      case "article":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "course":
        return "bg-green-100 text-green-700 border-green-200";
      case "paper":
        return "bg-purple-100 text-purple-700 border-purple-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Approach Tips */}
      {approachTips.length > 0 && (
        <Card className="p-6 bg-amber-50 border-amber-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            How to Approach This Opportunity
          </h3>
          <ul className="space-y-2">
            {approachTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Learning Resources */}
      {resources.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recommended Learning Resources
          </h3>
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg border ${getResourceColor(
                    resource.type
                  )}`}
                >
                  {getResourceIcon(resource.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {resource.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {resource.description}
                  </p>
                  {resource.duration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {resource.duration}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-red-600 hover:text-red-700"
                >
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Related Research */}
      {relatedResearch.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Related Research Papers
          </h3>
          <div className="space-y-4">
            {relatedResearch.map((paper, index) => (
              <div key={index} className="border-l-4 border-red-600 pl-4">
                <h4 className="font-medium text-gray-900">{paper.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {paper.authors.join(", ")} • {paper.year}
                </p>
                <p className="text-sm text-gray-700 mt-2">{paper.summary}</p>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="text-red-600 hover:text-red-700 p-0 h-auto mt-2"
                >
                  <a href={paper.url} target="_blank" rel="noopener noreferrer">
                    Read Paper →
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
