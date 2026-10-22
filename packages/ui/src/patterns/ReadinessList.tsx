import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type ReadinessItem = { id: string; label: ReactNode; status: ReactNode; detail?: ReactNode };
export type ReadinessListProps = { items: readonly ReadinessItem[]; mode?: "snapshot" | "live"; className?: string };

export function ReadinessList({ items, mode = "snapshot", className }: ReadinessListProps) {
  return <section className={classNames("eol-readiness-list", className)} data-mode={mode}><header><strong>Readiness</strong><small>{mode === "live" ? "Live status" : "Snapshot"}</small></header><ul>{items.map((item) => <li key={item.id}><span>{item.label}</span><strong>{item.status}</strong>{item.detail && <small>{item.detail}</small>}</li>)}</ul></section>;
}
