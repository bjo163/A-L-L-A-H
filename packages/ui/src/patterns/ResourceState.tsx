import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type ResourceStateKind = "initial" | "loading" | "empty" | "filtered-empty" | "error" | "partial" | "stale" | "forbidden";
export type ResourceStateProps = { state: ResourceStateKind; title?: ReactNode; description?: ReactNode; action?: ReactNode; children?: ReactNode; className?: string };

const defaultCopy: Record<ResourceStateKind, [string, string]> = {
  initial: ["Ready to load", "Start the request to view this resource."], loading: ["Loading", "The resource is being retrieved."], empty: ["No results", "There is no data to display yet."], "filtered-empty": ["No matches", "Try changing the current filters or search term."], error: ["Unable to load", "The resource could not be retrieved."], partial: ["Partially available", "Some resource data is unavailable."], stale: ["Showing stale data", "Refresh to check for newer resource data."], forbidden: ["Access restricted", "You do not have permission to view this resource."],
};

export function ResourceState({ state, title, description, action, children, className }: ResourceStateProps) {
  if (state === "initial" && children) return <>{children}</>;
  const [defaultTitle, defaultDescription] = defaultCopy[state];
  return <section className={classNames("eol-resource-state", `eol-resource-state--${state}`, className)} aria-live={state === "loading" ? "polite" : undefined}>{children && (state === "stale" || state === "partial") && <div className="eol-resource-state__content">{children}</div>}<strong>{title ?? defaultTitle}</strong><p>{description ?? defaultDescription}</p>{action && <div className="eol-resource-state__action">{action}</div>}</section>;
}
