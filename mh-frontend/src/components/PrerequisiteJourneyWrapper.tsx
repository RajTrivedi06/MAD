import React from "react";
import { MockPrerequisiteDisplay } from "./MockPrerequisiteDisplay";
import { PrerequisiteJourney } from "./PrerequisiteJourney";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Map } from "lucide-react";

interface PrerequisiteVisualizationProps {
  courseId: number;
  completedCourses?: number[];
  inProgressCourses?: number[];
  onCourseClick?: (courseId: number) => void;
  className?: string;
}

export const PrerequisiteJourneyWrapper: React.FC<
  PrerequisiteVisualizationProps
> = ({
  courseId,
  completedCourses = [],
  inProgressCourses = [],
  onCourseClick,
  className = "",
}) => {
  // If you want to fetch user progress from a hook, you can do it here
  // const { completedCourses, inProgressCourses } = useUserProgress();

  return (
    <div className={className}>
      <PrerequisiteJourney
        courseId={courseId}
        completedCourses={completedCourses}
        inProgressCourses={inProgressCourses}
        onNodeClick={onCourseClick}
      />
    </div>
  );
};

// Simple wrapper if you don't need user progress tracking
export const SimplePrerequisiteDisplay: React.FC<{
  courseId: number;
  className?: string;
}> = ({ courseId, className }) => {
  return <MockPrerequisiteDisplay courseId={courseId} className={className} />;
};
