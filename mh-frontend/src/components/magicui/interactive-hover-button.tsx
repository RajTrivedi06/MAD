import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InteractiveHoverButton ─────────────────────────────────────────────────────
 * A highly‑polished pill‑shaped button that
 *  • animates its background with a subtle radial glow
 *  • slides the label out + brings an arrow + new label in
 *  • adapts automatically to light ↔︎ dark colour‑schemes
 *
 * Drop‑in replacement for a regular <button>. All native props are forwarded.
 */
export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Rendered when the button is **not** hovered (default: children)
   */
  idleText?: React.ReactNode;
  /**
   * Rendered when the button **is** hovered (default: children)
   */
  hoverText?: React.ReactNode;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ idleText, hoverText, children, className, ...props }, ref) => {
  const defaultIdle = idleText ?? children;
  const defaultHover = hoverText ?? children;

  return (
    <button
      ref={ref}
      // ──────────────────────────────────────────────────────────────────────
      // The magic mostly lives in Tailwind utility classes & a handful of
      // CSS variables defined below via `style`.
      // ----------------------------------------------------------------------
      className={cn(
        "group relative inline-flex items-center overflow-hidden rounded-full px-6 py-2 font-semibold transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2",
        "bg-background border border-border shadow-sm hover:shadow-lg dark:shadow-black/40",
        className
      )}
      {...props}
    >
      {/* ---- GLASSY GLOW -------------------------------------------------- */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 scale-50 bg-gradient-to-br from-red-500 to-yellow-400 opacity-0 blur-xl transition-all duration-500 group-hover:scale-100 group-hover:opacity-20 dark:from-red-600 dark:to-yellow-500"
      />

      {/* ---- FRONT FACE --------------------------------------------------- */}
      <span className="flex items-center gap-2">
        {/* tiny dot */}
        <span className="h-2 w-2 rounded-full bg-red-500 transition-transform duration-300 group-hover:scale-110" />
        <span className="transition-transform duration-300 group-hover:-translate-x-10 group-hover:opacity-0 whitespace-nowrap">
          {defaultIdle}
        </span>
      </span>

      {/* ---- BACK FACE (slides in) --------------------------------------- */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-primary-foreground transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 translate-x-10 opacity-0">
        <span className="whitespace-nowrap">{defaultHover}</span>
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
