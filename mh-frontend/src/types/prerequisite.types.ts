// Core prerequisite node types
export interface PrereqNode {
  id: string;
  type: "COURSE" | "LEAF" | "OR" | "AND";
  course_id: number | null;
}

export interface PrereqLink {
  source: string;
  target: string;
}

export interface PrereqDAG {
  nodes: PrereqNode[];
  links: PrereqLink[];
}

// Course metadata
export interface CourseMetadata {
  course_id: number;
  course_code: string;
  title: string;
  credits: number | null;
  level: string | null;
  college: string | null;
  last_taught_term: string | null;
}

// User progress tracking
export interface UserProgress {
  completed: number[];
  in_progress: number[];
  planned: number[];
  failed: number[];
  last_updated: string;
}

// Course status for visual indicators
export type CourseStatus =
  | "completed"
  | "in-progress"
  | "available"
  | "locked"
  | "planned"
  | "failed";

// API response structure
export interface PrerequisiteGraphResponse {
  course_id: number;
  main_course: CourseMetadata | null;
  dag: PrereqDAG | null;
  course_metadata: Record<number, CourseMetadata>;
  total_courses: number;
  user_progress?: UserProgress;
  query_optimization: {
    strategy: string;
    performance_notes: string;
  };
}

// React Flow node data
export interface PrerequisiteNodeData {
  label: string;
  title: string;
  credits: string;
  level: string;
  status: CourseStatus;
  isMainCourse: boolean;
  courseId: number | null;
  nodeType: string;
  college?: string;
  lastTaughtTerm?: string;
}

// Logic node data for AND/OR operations
export interface LogicNodeData {
  nodeType: "AND" | "OR";
  label: string;
}

// Graph layout configuration
export interface GraphLayoutConfig {
  direction: "LR" | "TB" | "RL" | "BT";
  nodeSeparation: number;
  rankSeparation: number;
  marginX: number;
  marginY: number;
}

// Node interaction events
export interface NodeInteractionEvent {
  courseId: number;
  nodeId: string;
  status: CourseStatus;
  action: "click" | "hover" | "select";
}

// Legend configuration
export interface LegendItem {
  color: string;
  label: string;
  status: CourseStatus;
  icon: React.ReactNode;
}

// Graph statistics
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  completedCourses: number;
  inProgressCourses: number;
  availableCourses: number;
  lockedCourses: number;
  plannedCourses: number;
  maxDepth: number;
  averageCredits: number;
}

// Filter options for the graph
export interface GraphFilters {
  showCompleted: boolean;
  showInProgress: boolean;
  showAvailable: boolean;
  showLocked: boolean;
  showPlanned: boolean;
  showFailed: boolean;
  minCredits?: number;
  maxCredits?: number;
  colleges?: string[];
  levels?: string[];
}

// Zoom and view controls
export interface ViewControls {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  fitView: boolean;
  showMiniMap: boolean;
  showControls: boolean;
  showBackground: boolean;
}

// Animation configuration
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  staggerDelay: number;
}

// Export all types
export type {
  PrereqNode,
  PrereqLink,
  PrereqDAG,
  CourseMetadata,
  UserProgress,
  CourseStatus,
  PrerequisiteGraphResponse,
  PrerequisiteNodeData,
  LogicNodeData,
  GraphLayoutConfig,
  NodeInteractionEvent,
  LegendItem,
  GraphStats,
  GraphFilters,
  ViewControls,
  AnimationConfig,
};
