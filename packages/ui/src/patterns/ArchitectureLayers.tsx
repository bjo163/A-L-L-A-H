import type { ReactNode } from "react";
import { ArrowUpRightIcon } from "../primitives/Icon";
import { MangaEffect } from "./MangaEffect";
import type { SharedLinkProps, SharedLinkRenderer } from "./linkComposition";

export type ArchitectureLayer = { id: string; code: string; title: ReactNode; description: ReactNode; href: string };
export type ArchitectureLayerLinkProps = SharedLinkProps<ArchitectureLayer["id"]>;
export type ArchitectureLayersProps = {
  items: readonly ArchitectureLayer[];
  renderLink?: SharedLinkRenderer<ArchitectureLayer["id"]>;
  orchestrationLabel: ReactNode;
  summary: ReactNode;
  action: ReactNode;
};

/** Layer list and orbit summary composition; data and router-aware links stay consumer-owned. */
export function ArchitectureLayers({ items, renderLink, orchestrationLabel, summary, action }: ArchitectureLayersProps) {
  return <div className="plane-layout">
    <div className="plane-list">{items.map((item) => {
      const children = <><span>{item.code}</span><strong>{item.title}</strong><p>{item.description}</p><ArrowUpRightIcon size={14}/></>;
      const props = { id: item.id, href: item.href, className: "plane-row", children };
      return renderLink ? <LinkSlot key={item.id} props={props} renderLink={renderLink} /> : <MangaEffect key={item.id} as="a" row href={item.href} className="plane-row">{children}</MangaEffect>;
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

function LinkSlot({ props, renderLink }: { props: ArchitectureLayerLinkProps; renderLink: SharedLinkRenderer<ArchitectureLayer["id"]> }) {
  return <>{renderLink(props)}</>;
}
