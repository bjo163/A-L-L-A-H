import Link from "next/link";
import type { ReactNode } from "react";
import { IconText, MangaEffect, MangaPageIntro, PageCrosslinks } from "@empire/ui";
import type { IconName } from "@empire/ui";

export type PageLink = { href: string; label: string; external?: boolean; icon?: IconName; iconPosition?: "start" | "end" };

function PageLinkLabel({ link }: { link: PageLink }) {
  return link.icon ? <IconText icon={link.icon} position={link.iconPosition}>{link.label}</IconText> : link.label;
}

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
    breadcrumb={<div className="page-breadcrumb"><Link href="/"><IconText icon="arrowLeft" position="start">{homeLabel}</IconText></Link><span>/</span> {section} <span>/</span> {chapter}</div>}
    eyebrow={eyebrow}
    title={title}
    description={description}
    sfx={sfx}
    actions={<nav aria-label={section}>
        {links.map((link) => link.external
          ? <MangaEffect as="a" action key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"><PageLinkLabel link={link} /></MangaEffect>
          : <MangaEffect as={Link} action key={link.href} href={link.href}><PageLinkLabel link={link} /></MangaEffect>)}
      </nav>}
  />;
}

export function PortalPageCrosslinks({ links, label = "Tautan terkait" }: { links: PageLink[]; label?: string }) {
  return <PageCrosslinks
    label={label}
    items={links.map((link) => ({ id: link.href, href: link.href, content: <PageLinkLabel link={link} /> }))}
    renderLink={({ id, href, children }) => <Link key={id} href={href}>{children}</Link>}
  />;
}
