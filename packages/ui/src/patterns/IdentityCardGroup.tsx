import type { ReactNode } from "react";
import { Panel } from "../primitives/Panel";

export type IdentityCardItem = {
  id: string;
  label: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  descriptor?: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  featured?: boolean;
  className?: string;
};

export type IdentityCardGroupProps = { items: readonly IdentityCardItem[] };

/** Editorial identity cards with one featured entry and supporting companion cards. */
export function IdentityCardGroup({ items }: IdentityCardGroupProps) {
  return <div className="identity-row">{items.map((item) => <Panel
    as="article"
    manga
    key={item.id}
    className={`${item.featured ? "identity-main" : "identity-side"}${item.className ? ` ${item.className}` : ""}`}
  >
    <span className="panel-label">{item.label}</span>
    <h3>{item.title}</h3>
    {item.lead && <p>{item.lead}</p>}
    {item.descriptor && <p className="arsy-expansion">{item.descriptor}</p>}
    <p>{item.description}</p>
    {item.actions}
  </Panel>)}</div>;
}
