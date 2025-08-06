import dagre from "dagre";
import { Node, Edge, MarkerType } from "reactflow";
import {
  PrereqDAG,
  CourseMetadata,
  UserProgress,
  CourseStatus,
  PrerequisiteNodeData,
  LogicNodeData,
  GraphStats,
  GraphLayoutConfig,
} from "@/types/prerequisite.types";

/**
 * Calculate the status of a course based on user progress
 */
export const calculateCourseStatus = (
  courseId: number | null,
  userProgress: UserProgress | null
): CourseStatus => {
  if (!courseId || !userProgress) return "locked";

  if (userProgress.completed.includes(courseId)) return "completed";
  if (userProgress.in_progress.includes(courseId)) return "in-progress";
  if (userProgress.planned.includes(courseId)) return "planned";
  if (userProgress.failed.includes(courseId)) return "failed";

  // In a real implementation, check if prerequisites are met
  // For now, assume available if not in any progress category
  return "available";
};

/**
 * Transform backend DAG data to React Flow format
 */
export const transformDAGToFlow = (
  dag: PrereqDAG,
  courseMetadata: Record<number, CourseMetadata>,
  userProgress: UserProgress | null,
  mainCourseId: number
): { nodes: Node[]; edges: Edge[] } => {
  // Create React Flow nodes
  const nodes: Node[] = dag.nodes.map((node) => {
    const metadata = node.course_id ? courseMetadata[node.course_id] : null;
    const status = calculateCourseStatus(node.course_id, userProgress);

    const nodeData: PrerequisiteNodeData = {
      label: metadata?.course_code || node.id,
      title: metadata?.title || "",
      credits: metadata?.credits?.toString() || "0",
      level: metadata?.level || "",
      status,
      isMainCourse: node.course_id === mainCourseId,
      courseId: node.course_id,
      nodeType: node.type,
      college: metadata?.college || undefined,
      lastTaughtTerm: metadata?.last_taught_term || undefined,
    };

    return {
      id: node.id,
      type: node.type === "COURSE" ? "prerequisiteNode" : "logicNode",
      position: { x: 0, y: 0 }, // Will be calculated by dagre
      data: nodeData,
    };
  });

  // Create React Flow edges
  const edges: Edge[] = dag.links.map((link, index) => ({
    id: `edge-${index}`,
    source: link.source,
    target: link.target,
    type: "smoothstep",
    animated: false,
    style: {
      strokeWidth: 2,
      stroke: "#94a3b8",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: "#94a3b8",
    },
  }));

  return { nodes, edges };
};

/**
 * Apply automatic layout using Dagre algorithm
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  config: GraphLayoutConfig = {
    direction: "LR",
    nodeSeparation: 100,
    rankSeparation: 150,
    marginX: 50,
    marginY: 50,
  }
): { nodes: Node[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 80;

  dagreGraph.setGraph({
    rankdir: config.direction,
    nodesep: config.nodeSeparation,
    ranksep: config.rankSeparation,
    marginx: config.marginX,
    marginy: config.marginY,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Calculate graph statistics
 */
export const calculateGraphStats = (
  nodes: Node[],
  edges: Edge[],
  userProgress: UserProgress | null
): GraphStats => {
  const stats: GraphStats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    completedCourses: 0,
    inProgressCourses: 0,
    availableCourses: 0,
    lockedCourses: 0,
    plannedCourses: 0,
    maxDepth: 0,
    averageCredits: 0,
  };

  let totalCredits = 0;
  let courseCount = 0;

  nodes.forEach((node) => {
    const data = node.data as PrerequisiteNodeData;
    if (data.courseId) {
      courseCount++;
      const credits = parseFloat(data.credits) || 0;
      totalCredits += credits;

      switch (data.status) {
        case "completed":
          stats.completedCourses++;
          break;
        case "in-progress":
          stats.inProgressCourses++;
          break;
        case "available":
          stats.availableCourses++;
          break;
        case "locked":
          stats.lockedCourses++;
          break;
        case "planned":
          stats.plannedCourses++;
          break;
      }
    }
  });

  stats.averageCredits = courseCount > 0 ? totalCredits / courseCount : 0;

  // Calculate max depth (simplified - could be enhanced with actual depth calculation)
  const depthMap = new Map<string, number>();
  const calculateDepth = (
    nodeId: string,
    visited: Set<string> = new Set()
  ): number => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const incomingEdges = edges.filter((edge) => edge.target === nodeId);
    if (incomingEdges.length === 0) return 0;

    const maxDepth = Math.max(
      ...incomingEdges.map((edge) =>
        calculateDepth(edge.source, new Set(visited))
      )
    );

    depthMap.set(nodeId, maxDepth + 1);
    return maxDepth + 1;
  };

  nodes.forEach((node) => {
    if (!depthMap.has(node.id)) {
      calculateDepth(node.id);
    }
  });

  stats.maxDepth = Math.max(...depthMap.values(), 0);

  return stats;
};

/**
 * Filter nodes based on criteria
 */
export const filterNodes = (
  nodes: Node[],
  filters: {
    showCompleted?: boolean;
    showInProgress?: boolean;
    showAvailable?: boolean;
    showLocked?: boolean;
    showPlanned?: boolean;
    showFailed?: boolean;
    minCredits?: number;
    maxCredits?: number;
    colleges?: string[];
    levels?: string[];
  }
): Node[] => {
  return nodes.filter((node) => {
    const data = node.data as PrerequisiteNodeData;

    // Status filters
    if (filters.showCompleted === false && data.status === "completed")
      return false;
    if (filters.showInProgress === false && data.status === "in-progress")
      return false;
    if (filters.showAvailable === false && data.status === "available")
      return false;
    if (filters.showLocked === false && data.status === "locked") return false;
    if (filters.showPlanned === false && data.status === "planned")
      return false;
    if (filters.showFailed === false && data.status === "failed") return false;

    // Credit filters
    const credits = parseFloat(data.credits) || 0;
    if (filters.minCredits && credits < filters.minCredits) return false;
    if (filters.maxCredits && credits > filters.maxCredits) return false;

    // College filters
    if (filters.colleges && filters.colleges.length > 0) {
      if (!data.college || !filters.colleges.includes(data.college))
        return false;
    }

    // Level filters
    if (filters.levels && filters.levels.length > 0) {
      if (!data.level || !filters.levels.includes(data.level)) return false;
    }

    return true;
  });
};

/**
 * Get connected edges for a set of nodes
 */
export const getConnectedEdges = (nodes: Node[], edges: Edge[]): Edge[] => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
};

/**
 * Find the main course node
 */
export const findMainCourseNode = (nodes: Node[]): Node | null => {
  return (
    nodes.find((node) => {
      const data = node.data as PrerequisiteNodeData;
      return data.isMainCourse;
    }) || null
  );
};

/**
 * Get nodes by status
 */
export const getNodesByStatus = (
  nodes: Node[],
  status: CourseStatus
): Node[] => {
  return nodes.filter((node) => {
    const data = node.data as PrerequisiteNodeData;
    return data.status === status;
  });
};

/**
 * Calculate the path to a specific course
 */
export const calculatePathToCourse = (
  nodes: Node[],
  edges: Edge[],
  targetCourseId: number
): Node[] => {
  const targetNode = nodes.find((node) => {
    const data = node.data as PrerequisiteNodeData;
    return data.courseId === targetCourseId;
  });

  if (!targetNode) return [];

  const path: Node[] = [targetNode];
  const visited = new Set<string>([targetNode.id]);

  const findPredecessors = (nodeId: string): void => {
    const incomingEdges = edges.filter((edge) => edge.target === nodeId);

    incomingEdges.forEach((edge) => {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          path.unshift(sourceNode);
          findPredecessors(edge.source);
        }
      }
    });
  };

  findPredecessors(targetNode.id);
  return path;
};
