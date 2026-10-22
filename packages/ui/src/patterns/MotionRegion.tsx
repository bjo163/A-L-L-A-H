"use client";

import type { HTMLAttributes } from "react";
import { useMotionVisibility } from "../primitives/useMotionVisibility";

/** Adds viewport and document visibility pausing to an existing presentation region. */
export function MotionRegion(props: HTMLAttributes<HTMLDivElement>) {
  const motionRef = useMotionVisibility<HTMLDivElement>();
  return <div {...props} ref={motionRef} />;
}
