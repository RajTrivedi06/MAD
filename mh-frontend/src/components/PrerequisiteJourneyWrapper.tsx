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
      <Tabs defaultValue="journey" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="journey" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Interactive Journey
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Structure View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journey">
          <PrerequisiteJourney
            courseId={courseId}
            completedCourses={completedCourses}
            inProgressCourses={inProgressCourses}
            onNodeClick={onCourseClick}
          />
        </TabsContent>

        <TabsContent value="structure">
          <MockPrerequisiteDisplay courseId={courseId} />
        </TabsContent>
      </Tabs>
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
