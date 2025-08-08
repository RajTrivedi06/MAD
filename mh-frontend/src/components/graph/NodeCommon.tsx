import { motion } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { graphTheme as t } from "@/styles/graphTheme";

export function wrapLabel(s: string, max = 26) {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export const NodeShell: React.FC<{
  children: React.ReactNode;
  title?: string;
  tooltip?: string;
  width?: number;
  style?: React.CSSProperties;
}> = ({ children, title, tooltip, width = 260, style }) => (
  <Tooltip.Provider delayDuration={200}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.18 }}
          style={{
            width,
            background: t.panelBg,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            color: t.text,
            overflow: "hidden",
            ...style,
          }}
          aria-label={title}
        >
          {children}
        </motion.div>
      </Tooltip.Trigger>
      {tooltip && (
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={8}
            style={{
              background: "#0f172a",
              color: "#e2e8f0",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              maxWidth: 360,
              border: "1px solid #1f2937",
            }}
          >
            {tooltip}
            <Tooltip.Arrow width={10} height={6} />
          </Tooltip.Content>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  </Tooltip.Provider>
);
