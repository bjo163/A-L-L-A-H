import { cloneElement, type ReactElement, type ReactNode } from "react";
import type { IconGlyphProps } from "../primitives/Icon";

export type IconTextProps = {
  icon: ReactElement<IconGlyphProps>;
  children: ReactNode;
  position?: "start" | "end";
  size?: number;
  className?: string;
};

/** Visible text with a decorative shared glyph for a directional/action cue. */
export function IconText({ icon, children, position = "end", size = 14, className = "" }: IconTextProps) {
  const classes = ["eol-icon-text", `eol-icon-text--${position}`, className].filter(Boolean).join(" ");
  const glyph = cloneElement(icon, { size });
  return <span className={classes}>{position === "start" && glyph}{children}{position === "end" && glyph}</span>;
}
