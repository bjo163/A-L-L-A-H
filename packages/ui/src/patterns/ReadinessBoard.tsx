import type { ReactNode } from "react";
import { Panel } from "../primitives/Panel";

export type ReadinessBoardItem = { id: string; label: ReactNode; status: ReactNode };
export type ReadinessBoardProps = {
  label: ReactNode;
  title: ReactNode;
  reviewedLabel: ReactNode;
  reviewedAt: string;
  reviewedDate: ReactNode;
  items: readonly ReadinessBoardItem[];
  note: ReactNode;
};

/** Snapshot status board that makes review date and non-live provenance explicit. */
export function ReadinessBoard({ label, title, reviewedLabel, reviewedAt, reviewedDate, items, note }: ReadinessBoardProps) {
  return <Panel as="aside" manga className="readiness-board">
    <span className="panel-label">{label}</span>
    <h3>{title}</h3>
    <p className="readiness-reviewed"><span>{reviewedLabel}</span><time dateTime={reviewedAt}>{reviewedDate}</time></p>
    {items.map((item) => <div className="readiness-row" key={item.id}><span>{item.label}</span><strong>{item.status}</strong></div>)}
    <p>{note}</p>
  </Panel>;
}
