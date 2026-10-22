import type { ReactNode } from "react";

export type SystemAtlasItem = {
  id: string;
  number: string;
  category: ReactNode;
  title: ReactNode;
  titleId?: string;
  description: ReactNode;
  system: ReactNode;
};

export type SystemAtlasProps = { items: readonly SystemAtlasItem[] };

/** Editorial architecture atlas; anchor ownership and localized content stay with the app. */
export function SystemAtlas({ items }: SystemAtlasProps) {
  return <div className="atlas-list">
    {items.map((item) => <article className="atlas-item" id={item.id} key={item.id}>
      <span className="atlas-num">{item.number}</span>
      <div>
        <p className="panel-label">{item.category}</p>
        <h2 id={item.titleId}>{item.title}</h2>
        <p>{item.description}</p>
      </div>
      <span className="atlas-system">{item.system}</span>
    </article>)}
  </div>;
}
