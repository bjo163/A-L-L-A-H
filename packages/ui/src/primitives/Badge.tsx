import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={classNames("eol-badge", `eol-badge--${tone}`, className)}
      data-tone={tone}
    >
      {children}
    </span>
  );
}
