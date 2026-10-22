import type { ReactNode } from "react";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/Icon";

export type IconTextProps = {
  icon: IconName;
  children: ReactNode;
  position?: "start" | "end";
  size?: number;
  className?: string;
};

/** Visible text with a decorative shared glyph for a directional/action cue. */
export function IconText({ icon, children, position = "end", size = 14, className = "" }: IconTextProps) {
  const classes = ["eol-icon-text", `eol-icon-text--${position}`, className].filter(Boolean).join(" ");
  const glyph = <Icon name={icon} size={size} />;
  return <span className={classes}>{position === "start" && glyph}{children}{position === "end" && glyph}</span>;
}
