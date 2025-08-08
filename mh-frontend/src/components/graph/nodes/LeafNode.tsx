import { Handle, Position, NodeProps } from "reactflow";
import { NodeShell, wrapLabel } from "../../graph/NodeCommon";
import { graphTheme as t } from "@/styles/graphTheme";

export default function LeafNode({ data }: NodeProps) {
  const label = data?.label ?? "Requirement";
  return (
    <NodeShell
      title={label}
      tooltip={label}
      width={280}
      style={{
        background: t.leafFill,
        border: `1px solid ${t.leafStroke}`,
        borderRadius: 12,
      }}
    >
      <div style={{ padding: 10, fontSize: 13, color: t.subtext }}>
        {wrapLabel(label, 44)}
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
