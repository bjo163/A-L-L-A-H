import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type TimelineItem = { id: string; label: ReactNode; title: ReactNode; description?: ReactNode; timestamp?: ReactNode };
export type TimelineProps = { items: readonly TimelineItem[]; className?: string };

export function Timeline({ items, className }: TimelineProps) {
  return <ol className={classNames("eol-timeline", className)}>{items.map((item) => <li key={item.id}><span className="eol-timeline__marker" aria-hidden="true" /><div><small>{item.label}</small><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}{item.timestamp && <time>{item.timestamp}</time>}</div></li>)}</ol>;
}
