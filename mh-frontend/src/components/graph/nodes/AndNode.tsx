import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { graphTheme as t } from "@/styles/graphTheme";

export default function AndNode({}: NodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0.85, rotate: 45, scale: 0.96 }}
      animate={{ opacity: 1, rotate: 45, scale: 1 }}
      style={{
        width: 84,
        height: 84,
        background: `linear-gradient(180deg, ${t.andFill} 0%, ${t.andFillSoft} 120%)`,
        border: `2px solid ${t.border}`,
        borderRadius: 12,
        boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
      }}
      aria-label="AND"
      title="All incoming requirements must be satisfied."
    >
      <div style={{ transform: "rotate(-45deg)" }}>AND</div>
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
    </motion.div>
  );
}
