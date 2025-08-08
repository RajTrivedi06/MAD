import dagre from "dagre";
import type { Node, Edge, XYPosition } from "reactflow";

function measureNode(label: string, type?: string) {
  const base =
    type === "course" ? 240 : type === "or" ? 120 : type === "and" ? 120 : 220;
  const extra = Math.min(
    400,
    Math.max(0, label?.length ? (label.length - 18) * 6 : 0)
  );
  const width = Math.min(520, Math.max(base, base + extra));
  const height =
    type === "or" || type === "and" ? 46 : label.length > 40 ? 70 : 54;
  return { width, height };
}

export type LayoutDirection = "TB" | "BT" | "LR" | "RL";

export function layoutWithDagre<N extends Node = Node, E extends Edge = Edge>(
  nodesIn: N[],
  edgesIn: E[],
  opts?: {
    direction?: LayoutDirection;
    nodeSep?: number;
    rankSep?: number;
    marginX?: number;
    marginY?: number;
    fitViewPadding?: number;
  }
) {
  const {
    direction = "LR",
    nodeSep = 40,
    rankSep = 80,
    marginX = 40,
    marginY = 40,
  } = opts || {};

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: marginX,
    marginy: marginY,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodesIn.forEach((n) => {
    const label = (n.data as any)?.label ?? n.id;
    const { width, height } = measureNode(String(label), n.type);
    g.setNode(n.id, { width, height });
  });

  edgesIn.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const nodes: N[] = nodesIn.map((n) => {
    const pos = g.node(n.id) as XYPosition & { x: number; y: number };
    const { width, height } = measureNode(
      String((n.data as any)?.label ?? n.id),
      n.type
    );
    return {
      ...n,
      width,
      height,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
      draggable: true,
    };
  });

  const edges: E[] = edgesIn.map((e) => ({ ...e }));

  return { nodes, edges };
}

export function stripPositions<N extends Node = Node>(nodes: N[]): N[] {
  return nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } as XYPosition }));
}
