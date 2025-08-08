import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from "reactflow";
import { graphTheme as t } from "@/styles/graphTheme";

export default function FancyEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    data,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? t.edgeHover : t.edge,
          strokeWidth: selected ? 2.5 : 1.8,
          opacity: 0.95,
        }}
        markerEnd="url(#arrow)"
      />
      <EdgeLabelRenderer>
        {data?.label && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 6,
              background: "rgba(17,19,26,0.8)",
              color: "#e5e7eb",
              border: "1px solid #374151",
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
