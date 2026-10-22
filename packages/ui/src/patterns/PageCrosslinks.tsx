import type { ReactNode } from "react";
import type { SharedLinkProps, SharedLinkRenderer } from "./linkComposition";

export type PageCrosslinkItem = { id: string; href: string; content: ReactNode };
export type PageCrosslinkLinkProps = SharedLinkProps<PageCrosslinkItem["id"]>;
export type PageCrosslinksProps = {
  items: readonly PageCrosslinkItem[];
  label?: string;
  renderLink?: SharedLinkRenderer<PageCrosslinkItem["id"]>;
};

/** Related-page link row; a consumer can supply framework-specific link rendering. */
export function PageCrosslinks({ items, label = "Related pages", renderLink }: PageCrosslinksProps) {
  return <nav className="atlas-crosslinks" aria-label={label}>
    {items.map((item) => renderLink
      ? <LinkSlot key={item.id} item={item} renderLink={renderLink} />
      : <a key={item.id} href={item.href}>{item.content}</a>)}
  </nav>;
}

function LinkSlot({ item, renderLink }: { item: PageCrosslinkItem; renderLink: SharedLinkRenderer<PageCrosslinkItem["id"]> }) {
  return <>{renderLink({ id: item.id, href: item.href, children: item.content })}</>;
}
