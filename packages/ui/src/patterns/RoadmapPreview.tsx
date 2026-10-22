import type { ReactNode } from "react";
import { MangaEffect } from "./MangaEffect";

export type RoadmapPreviewItem = {
  id: string;
  label: ReactNode;
  status: ReactNode;
};

export type RoadmapPreviewProps = {
  checkpoint: string;
  stage: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action: ReactNode;
  items: readonly RoadmapPreviewItem[];
};

/** Homepage roadmap teaser layout; the consuming app owns timeline content and routing. */
export function RoadmapPreview({ checkpoint, stage, title, description, action, items }: RoadmapPreviewProps) {
  return <MangaEffect panel className="roadmap-teaser">
    <div>
      <span className="checkpoint-number">{checkpoint}</span>
      <span className="checkpoint-stage">{stage}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
    <div className="roadmap-rungs" role="list">
      {items.map((item, index) => <div key={item.id} role="listitem">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <strong>{item.label}</strong>
        <small>{item.status}</small>
      </div>)}
    </div>
  </MangaEffect>;
}
