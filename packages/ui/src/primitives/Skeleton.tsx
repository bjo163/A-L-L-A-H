"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { classNames } from "./classNames";
import { useMotionVisibility } from "./useMotionVisibility";

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
  const motionRef = useMotionVisibility<HTMLSpanElement>();

  return (
    <span
      ref={motionRef}
      aria-hidden="true"
      className={classNames("eol-skeleton", `eol-skeleton--${shape}`, className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}
