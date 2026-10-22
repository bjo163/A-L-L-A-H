import type { ReactNode } from "react";
import { Icon } from "../primitives/Icon";
import { MangaEffect } from "./MangaEffect";

export type ArchitectureLayer = { id: string; code: string; title: ReactNode; description: ReactNode; href: string };
export type ArchitectureLayerLinkProps = { href: string; className: string; children: ReactNode; itemId: string; key: string };
export type ArchitectureLayersProps = {
  items: readonly ArchitectureLayer[];
  renderLink?: (props: ArchitectureLayerLinkProps) => ReactNode;
  orchestrationLabel: ReactNode;
  summary: ReactNode;
  action: ReactNode;
};

/** Layer list and orbit summary composition; data and router-aware links stay consumer-owned. */
export function ArchitectureLayers({ items, renderLink, orchestrationLabel, summary, action }: ArchitectureLayersProps) {
  return <div className="plane-layout">
    <div className="plane-list">{items.map((item) => {
      const children = <><span>{item.code}</span><strong>{item.title}</strong><p>{item.description}</p><Icon name="arrowUpRight" size={14}/></>;
      const props = { href: item.href, className: "plane-row", children, itemId: item.id, key: item.id };
      return renderLink ? renderLink(props) : <MangaEffect key={item.id} as="a" row href={item.href} className="plane-row">{children}</MangaEffect>;
    })}</div>
    <MangaEffect as="aside" panel className="plane-aside">
      <div className="stacks-orbit" aria-hidden="true">
        <div className="stack-ring ring-large"/><div className="stack-ring ring-mid"/><div className="stack-ring ring-small"/>
        <div className="stack-kernel">ARSY<small>{orchestrationLabel}</small></div>
      </div>
      <p>{summary}</p>
      {action}
    </MangaEffect>
  </div>;
}
