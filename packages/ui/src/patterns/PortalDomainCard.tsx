import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "../primitives/Badge";
import { DomainSymbol, type DomainSymbolName } from "./DomainSymbol";
import { MangaEffect } from "./MangaEffect";

export type DomainAccent = "amber" | "violet" | "rose" | "mint" | "blue" | "gold";
export type PortalDomainCardProps = {
  id: string;
  index: string;
  accent: DomainAccent;
  symbol: DomainSymbolName;
  status: string;
  statusTone: BadgeTone;
  descriptor: ReactNode;
  title: ReactNode;
  summary: ReactNode;
  action: ReactNode;
};

/** Shared Portal domain card, including its original orbit artwork and compact vector marker. */
export function PortalDomainCard({
  id, index, accent, symbol, status, statusTone, descriptor, title, summary, action,
}: PortalDomainCardProps) {
  return <MangaEffect as="article" panel interactive className={`frontier-card theme-${accent}`} id={id}>
    <div className="frontier-top"><span className="card-index">/ {index}</span><Badge className="stage-pill" tone={statusTone}>{status}</Badge></div>
    <div className="frontier-graphic" aria-hidden="true"><span className="shape-a"/><span className="shape-b"/><span className="shape-c"/></div>
    <div className="frontier-content">
      <p className="panel-label frontier-domain-label"><DomainSymbol name={symbol} size={16} className="frontier-domain-icon"/>{descriptor}</p>
      <h3>{title}</h3><p>{summary}</p>{action}
    </div>
  </MangaEffect>;
}
