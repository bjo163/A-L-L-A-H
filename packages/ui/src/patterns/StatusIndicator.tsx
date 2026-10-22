import type { ReactNode } from "react";
import type { BadgeTone } from "../primitives/Badge";

/** Compact text status with a shape cue; tone always has a readable label. */
export function StatusIndicator({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={["eol-status-indicator", className].filter(Boolean).join(" ")} data-tone={tone}>
      <span className="eol-status-indicator__dot" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
