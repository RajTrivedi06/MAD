import { useState } from "react";
import {
  ChevronDown,
  Globe,
  Star,
  Users,
  FlaskConical,
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LabMatch } from "../types/labMatch";
import { EmailTemplateModal } from "./EmailTemplateModal";
import { LearningResourcesPanel } from "./LearningResourcesPanel";

interface LabMatchCardProps {
  match: LabMatch;
}

export function LabMatchCard({ match }: LabMatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200 hover:shadow-md",
          expanded && "shadow-md"
        )}
      >
        <CardHeader
          className="cursor-pointer p-6"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                  <FlaskConical className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {match.labTitle}
                  </h3>
                  <p className="text-base text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {match.piName} • {match.department}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "px-4 py-2 rounded-lg border text-center",
                  getMatchColor(match.fitScore)
                )}
              >
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-xl font-bold">{match.fitScore}%</span>
                </div>
                <p className="text-xs font-medium">Match Score</p>
              </div>
              <ChevronDown
                className={cn(
                  "w-6 h-6 text-gray-500 transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </div>
          </div>

          <p className="text-base text-gray-700 mt-4 line-clamp-2 leading-relaxed">
            {match.blurb}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {match.researchAreas.slice(0, 3).map((area) => (
              <Badge
                key={area}
                variant="secondary"
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 font-medium"
              >
                {area}
              </Badge>
            ))}
            {match.openings && (
              <Badge className="text-sm px-3 py-1 bg-green-100 text-green-800 border border-green-200 font-medium">
                <Calendar className="w-3 h-3 mr-1" />
                Openings Available
              </Badge>
            )}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="px-6 pb-6 border-t bg-gray-50">
            <div className="space-y-6 pt-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-base mb-2 text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Why you&apos;re a match
                </h4>
                <p className="text-base text-gray-700 leading-relaxed">
                  {match.whyMatch}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-3 text-gray-900">
                  Research Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.researchAreas.map((area) => (
                    <Badge
                      key={area}
                      variant="outline"
                      className="text-sm px-3 py-1 border-gray-300"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="default"
                  size="default"
                  onClick={() => setShowEmailModal(true)}
                  className="flex-1 h-11 font-medium bg-red-600 hover:bg-red-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Email Template
                </Button>
                {match.labUrl && (
                  <Button
                    variant="outline"
                    size="default"
                    asChild
                    className="flex-1 h-11 font-medium border-2 hover:bg-gray-50"
                  >
                    <a
                      href={match.labUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Lab Website
                    </a>
                  </Button>
                )}
              </div>

              {/* Direct Contact Option */}
              <div className="text-center">
                <span className="text-sm text-gray-600">or </span>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="text-red-600 hover:text-red-700"
                >
                  <a href={`mailto:${match.contactEmail}`}>
                    contact directly at {match.contactEmail}
                  </a>
                </Button>
              </div>

              {/* Learning Resources Section */}
              {(match.learningResources ||
                match.approachTips ||
                match.relatedResearch) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-lg mb-4 text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-red-600" />
                    Preparation Resources
                  </h4>
                  <LearningResourcesPanel
                    resources={match.learningResources}
                    relatedResearch={match.relatedResearch}
                    approachTips={match.approachTips}
                  />
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Email Template Modal */}
      <EmailTemplateModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        match={match}
      />
    </>
  );
}
