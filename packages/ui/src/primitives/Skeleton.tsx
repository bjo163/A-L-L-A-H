import type { CSSProperties, HTMLAttributes } from "react";
import { classNames } from "./classNames";

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  shape?: "text" | "rect" | "circle";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

export function Skeleton({
  shape = "text",
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={classNames("eol-skeleton", `eol-skeleton--${shape}`, className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}
