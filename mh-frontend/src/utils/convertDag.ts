import dagre from "dagre";
import type { Node as RFNode, Edge as RFEdge } from "reactflow";
import { MarkerType } from "reactflow";

export interface D3Node {
  id: string;
  course_id?: string;
  label?: string;
  type?: string; // 'course', 'AND', 'OR'
}

export interface D3Link {
  source?: string;
  target?: string;
  from?: string;
  to?: string;
}

export interface D3Dag {
  nodes: D3Node[];
  links: D3Link[];
}

export interface CourseMetadata {
  course_id: number;
  course_code: string;
  title: string;
  description?: string;
  credits?: number;
  level?: string;
  college?: string;
  last_taught_term?: string;
}

export interface PrerequisiteGraphData {
  course_id: number;
  main_course: CourseMetadata;
  dag: D3Dag;
  course_metadata: Record<string, CourseMetadata>;
  total_courses: number;
}

/**
 * Convert a D3-style DAG into React Flow nodes+edges with course metadata
 */
export function convertDagToReactFlow(
  dag: D3Dag,
  courseMetadata: Record<string, CourseMetadata>
) {
  // 1) Build a dagre graph for auto-layout
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB", // Top to bottom layout
    marginx: 50,
    marginy: 50,
    nodesep: 100, // Vertical separation between nodes
    edgesep: 50, // Horizontal separation between edges
    ranksep: 150, // Separation between ranks
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 2) Add nodes to dagre with different sizes based on type
  dag.nodes.forEach((n) => {
    const isCourse = n.course_id && courseMetadata[n.course_id];
    const isLogicNode = n.type === "AND" || n.type === "OR";

    if (isCourse) {
      // Course nodes are larger to accommodate course info
      g.setNode(n.id, { width: 250, height: 120 });
    } else if (isLogicNode) {
      // Logic nodes (AND/OR) are smaller
      g.setNode(n.id, { width: 80, height: 40 });
    } else {
      // Default size for other nodes
      g.setNode(n.id, { width: 150, height: 60 });
    }
  });

  // 3) Add edges to dagre
  dag.links.forEach((l) => {
    const source = l.source || l.from;
    const target = l.target || l.to;
    if (source && target) {
      g.setEdge(source, target);
    }
  });

  // 4) Run layout
  dagre.layout(g);

  // 5) Map to React Flow nodes
  const nodes: RFNode[] = dag.nodes.map((n) => {
    const nodeData = g.node(n.id)!;
    const isCourse = n.course_id && courseMetadata[n.course_id];
    const isLogicNode = n.type === "AND" || n.type === "OR";

    let nodeType = "default";
    let data: Record<string, unknown> = { label: n.label || n.id };

    if (isCourse) {
      nodeType = "courseCard";
      const course = courseMetadata[n.course_id!];
      data = {
        ...course,
        courseId: n.course_id,
        label: course.title,
        isMainCourse: false, // Will be set later if needed
      };
    } else if (isLogicNode) {
      nodeType = "logicNode";
      data = {
        label: n.type,
        type: n.type,
        isLogicNode: true,
      };
    }

    return {
      id: n.id,
      type: nodeType,
      data: data,
      position: {
        x: nodeData.x - nodeData.width / 2,
        y: nodeData.y - nodeData.height / 2,
      },
    };
  });

  // 6) Map to React Flow edges
  const edges: RFEdge[] = dag.links
    .map((l, i) => {
      const source = l.source || l.from;
      const target = l.target || l.to;
      if (!source || !target) return null;

      const edge: RFEdge = {
        id: `e-${source}-${target}-${i}`,
        source: source,
        target: target,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#64748b", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#64748b",
        },
      };
      return edge;
    })
    .filter((edge): edge is RFEdge => edge !== null);

  return { nodes, edges };
}

/**
 * Mark the main course node in the graph
 */
export function markMainCourse(
  nodes: RFNode[],
  mainCourseId: number
): RFNode[] {
  return nodes.map((node) => {
    if (node.data.courseId === mainCourseId) {
      return {
        ...node,
        data: {
          ...node.data,
          isMainCourse: true,
        },
      };
    }
    return node;
  });
}
