import { Handle, Position, NodeProps } from "reactflow";
import { NodeShell, wrapLabel } from "../../graph/NodeCommon";
import { graphTheme as t } from "@/styles/graphTheme";

export default function CourseNode({ data, selected }: NodeProps) {
  const title = data?.title ?? data?.label ?? "Course";
  const code = data?.course_code ?? data?.label;
  const subtitle = `${code ?? ""}${
    data?.credits ? ` • ${data.credits} cr.` : ""
  }${data?.level ? ` • ${data.level}` : ""}`;
  const last = data?.last_taught_term
    ? `Last taught: ${data.last_taught_term}`
    : null;

  return (
    <NodeShell
      title={title}
      tooltip={title}
      width={300}
      style={{
        borderColor: selected ? t.courseStroke : "transparent",
        background: `linear-gradient(180deg, ${t.courseFill} 0%, ${t.courseFillSoft} 120%)`,
      }}
    >
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, opacity: 0.95 }}>
          {wrapLabel(title, 38)}
        </div>
        <div
          style={{ fontSize: 12, color: "#e5edff", opacity: 0.9, marginTop: 4 }}
        >
          {subtitle}
        </div>
        {last && (
          <div
            style={{
              fontSize: 11,
              color: "#dbeafe",
              opacity: 0.85,
              marginTop: 6,
            }}
          >
            {last}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
      />
    </NodeShell>
  );
}
