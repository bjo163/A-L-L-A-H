import Link from "next/link";
import type { ReactNode } from "react";
import { MangaEffect, MangaPageIntro } from "@empire/ui";

export type PageLink = { href: string; label: string; external?: boolean };

export function PortalPageIntro({
  homeLabel, section, chapter, eyebrow, title, description, links, sfx,
}: {
  homeLabel: string; section: string; chapter: string; eyebrow: string;
  title: ReactNode; description: string; links: PageLink[]; sfx: string;
}) {
  return <MangaPageIntro
    className="page-hero"
    eyebrowClassName="eyebrow"
    actionsClassName="page-hero-links"
    breadcrumb={<div className="page-breadcrumb"><Link href="/">← {homeLabel}</Link><span>/</span> {section} <span>/</span> {chapter}</div>}
    eyebrow={eyebrow}
    title={title}
    description={description}
    sfx={sfx}
    actions={<nav aria-label={section}>
        {links.map((link) => link.external
          ? <MangaEffect as="a" action key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</MangaEffect>
          : <MangaEffect as={Link} action key={link.href} href={link.href}>{link.label}</MangaEffect>)}
      </nav>}
  />;
}

export function PortalPageCrosslinks({ links, label = "Tautan terkait" }: { links: PageLink[]; label?: string }) {
  return <nav className="atlas-crosslinks" aria-label={label}>
    {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
  </nav>;
}
