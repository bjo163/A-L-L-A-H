import type { ReactNode } from "react";
import { Card } from "./Card";
import { classNames } from "../primitives/classNames";

export type EntityCardProps = { title: ReactNode; meta?: ReactNode; summary?: ReactNode; status?: ReactNode; actions?: ReactNode; selected?: boolean; interactive?: boolean; className?: string };

export function EntityCard({ title, meta, summary, status, actions, selected = false, interactive = false, className }: EntityCardProps) {
  return <Card className={classNames("eol-entity-card", className)} selected={selected} interactive={interactive}><div className="eol-entity-card__head"><div><strong>{title}</strong>{meta && <small>{meta}</small>}</div>{status && <span>{status}</span>}</div>{summary && <p>{summary}</p>}{actions && <div className="eol-entity-card__actions">{actions}</div>}</Card>;
}
