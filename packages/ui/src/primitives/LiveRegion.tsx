import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";

export type LiveRegionProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-live" | "role"> & {
  children?: ReactNode;
  politeness?: "polite" | "assertive" | "off";
  atomic?: boolean;
};

export function LiveRegion({ children, politeness = "polite", atomic = true, className, ...props }: LiveRegionProps) {
  return <div {...props} className={classNames("eol-live-region", className)} aria-live={politeness} aria-atomic={atomic}>{children}</div>;
}
