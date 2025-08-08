import { Handle, Position, NodeProps } from "reactflow";
import { NodeShell } from "../../graph/NodeCommon";
import { graphTheme as t } from "@/styles/graphTheme";

export default function OrNode({}: NodeProps) {
  return (
    <NodeShell
      title="OR"
      tooltip="Any one of the incoming requirements satisfies this gate."
      width={140}
      style={{
        background: `linear-gradient(180deg, ${t.orFill} 0%, ${t.orFillSoft} 120%)`,
        borderRadius: 999,
        textAlign: "center",
      }}
    >
      <div style={{ padding: "10px 0", fontWeight: 800, letterSpacing: 1 }}>
        OR
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
