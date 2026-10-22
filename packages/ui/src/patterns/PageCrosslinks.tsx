import type { ReactNode } from "react";

export type PageCrosslinkItem = { id: string; href: string; content: ReactNode };
export type PageCrosslinkLinkProps = { id: string; href: string; children: ReactNode };
export type PageCrosslinksProps = {
  items: readonly PageCrosslinkItem[];
  label?: string;
  renderLink?: (props: PageCrosslinkLinkProps) => ReactNode;
};

/** Related-page link row; a consumer can supply framework-specific link rendering. */
export function PageCrosslinks({ items, label = "Related pages", renderLink }: PageCrosslinksProps) {
  return <nav className="atlas-crosslinks" aria-label={label}>
    {items.map((item) => renderLink
      ? renderLink({ id: item.id, href: item.href, children: item.content })
      : <a key={item.id} href={item.href}>{item.content}</a>)}
  </nav>;
}
