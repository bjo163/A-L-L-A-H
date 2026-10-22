import { Badge, Disclosure, EmptyState, SectionHeading, KnowledgeIcon } from "@empire/ui";

export type KnowledgeEntry = {
  id: string;
  code: string;
  arabic?: string;
  translit: string;
  term: string;
  attribute: string;
  domain: string;
  wisdom: string;
  revelations: string;
  editorialStatus: string;
};

type KnowledgeViewProps = {
  entries: readonly KnowledgeEntry[];
};

export function KnowledgeView({ entries }: KnowledgeViewProps) {
  return <>
    <section>
      <SectionHeading layout="compact" eyebrow="SOURCE INDEX" title={<>Asma mappings <span className="count-chip">{entries.length}</span></>} aside={<Badge tone="warning">DRAFT REVIEW</Badge>} />
      <div className="knowledge-grid">
        {entries.map((entry) => <Disclosure className="knowledge-card" key={entry.id} summary={<>
          <span className="knowledge-symbol" lang={entry.arabic ? "ar" : undefined} dir={entry.arabic ? "rtl" : undefined}>{entry.arabic || <KnowledgeIcon size={20} />}</span>
          <span className="knowledge-title"><strong>{entry.term}</strong><small dir="ltr">{entry.translit} · {entry.code}</small></span>
          <Badge tone="neutral">{entry.editorialStatus}</Badge>
        </>}>
          <div className="knowledge-detail"><p><strong>Project attribute</strong><br />{entry.attribute}</p><p><strong>Domain</strong><br />{entry.domain}</p><p>{entry.wisdom}</p><small>Source note: {entry.revelations}</small></div>
        </Disclosure>)}
      </div>
      {entries.length === 0 && <EmptyState title="No mappings match" description="Try searching by Arabic, transliteration, term, or domain." />}
    </section>
  </>;
}
