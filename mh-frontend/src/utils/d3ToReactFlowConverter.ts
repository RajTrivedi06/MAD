import { Node, Edge } from "reactflow";

interface D3Node {
  id: string;
  type: "COURSE" | "LEAF" | "AND" | "OR";
  course_id: number | null;
}

interface D3Link {
  source: string;
  target: string;
}

interface D3Graph {
  nodes: D3Node[];
  links: D3Link[];
}

export function convertD3ToReactFlow(d3Data: D3Graph, targetCourseId: number) {
  // Calculate positions using a simple hierarchical layout
  const positions = calculateHierarchicalLayout(d3Data);

  // Convert nodes
  const reactFlowNodes: Node[] = d3Data.nodes.map((node) => {
    const position = positions.get(node.id) || { x: 0, y: 0 };

    // Basic node data
    const nodeData = {
      label: node.id,
      courseId: node.course_id || 0,
      courseCode: node.id,
      title: "", // Will be enriched by your hook
      credits: "", // Will be enriched by your hook
      description: "", // Will be enriched by your hook
    };

    return {
      id: node.id,
      type: "default", // Your component expects this
      position,
      data: nodeData,
    };
  });

  // Convert edges
  const reactFlowEdges: Edge[] = d3Data.links.map((link, index) => ({
    id: `edge-${link.source}-${link.target}`,
    source: link.source,
    target: link.target,
    type: "smoothstep",
    animated: false,
    style: { stroke: "#6b7280", strokeWidth: 2 },
  }));

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
  };
}

function calculateHierarchicalLayout(d3Data: D3Graph) {
  const positions = new Map<string, { x: number; y: number }>();

  // Build adjacency lists
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();

  d3Data.links.forEach((link) => {
    if (!children.has(link.target)) {
      children.set(link.target, []);
    }
    children.get(link.target)!.push(link.source);

    if (!parents.has(link.source)) {
      parents.set(link.source, []);
    }
    parents.get(link.source)!.push(link.target);
  });

  // Find root nodes (nodes with no parents)
  const roots = d3Data.nodes.filter(
    (node) => !parents.has(node.id) || parents.get(node.id)!.length === 0
  );

  // Calculate levels
  const levels = new Map<string, number>();
  const queue: string[] = roots.map((r) => r.id);

  roots.forEach((root) => levels.set(root.id, 0));

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const currentLevel = levels.get(nodeId)!;

    const nodeChildren = children.get(nodeId) || [];
    nodeChildren.forEach((childId) => {
      if (!levels.has(childId)) {
        levels.set(childId, currentLevel + 1);
        queue.push(childId);
      }
    });
  }

  // Group nodes by level
  const nodesByLevel = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(nodeId);
  });

  // Calculate positions
  const horizontalSpacing = 300;
  const verticalSpacing = 150;

  nodesByLevel.forEach((nodes, level) => {
    const totalWidth = (nodes.length - 1) * horizontalSpacing;
    const startX = -totalWidth / 2 + 400; // Center around x=400

    nodes.forEach((nodeId, index) => {
      positions.set(nodeId, {
        x: startX + index * horizontalSpacing,
        y: level * verticalSpacing + 50, // Start from y=50
      });
    });
  });

  return positions;
}

// Test data from your example
export const testD3Data: D3Graph = {
  links: [
    { source: "OR_1", target: "A A E/ECON 526" },
    { source: "AND_2", target: "OR_1" },
    { source: "OR_3", target: "AND_2" },
    { source: "MATH 211", target: "OR_3" },
    { source: "MATH 221", target: "OR_3" },
    { source: "ECON 301", target: "AND_2" },
    { source: "STAT 301", target: "AND_2" },
    { source: "graduate/professional standing", target: "OR_1" },
  ],
  nodes: [
    { id: "A A E/ECON 526", type: "COURSE", course_id: 356 },
    { id: "OR_1", type: "OR", course_id: null },
    { id: "AND_2", type: "AND", course_id: null },
    { id: "OR_3", type: "OR", course_id: null },
    { id: "MATH 211", type: "LEAF", course_id: 11619 },
    { id: "MATH 221", type: "LEAF", course_id: 11623 },
    { id: "ECON 301", type: "LEAF", course_id: 5565 },
    { id: "STAT 301", type: "LEAF", course_id: 18439 },
    { id: "graduate/professional standing", type: "LEAF", course_id: null },
  ],
};

// Get the converted data for testing
export function getTestReactFlowData() {
  return convertD3ToReactFlow(testD3Data, 356);
}
