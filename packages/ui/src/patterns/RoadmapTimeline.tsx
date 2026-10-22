import type { ReactNode } from "react";

export type RoadmapTimelineItem = {
  id: string;
  number: string;
  status: ReactNode;
  title: ReactNode;
  description: ReactNode;
  current?: boolean;
};

export type RoadmapTimelineProps = { items: readonly RoadmapTimelineItem[]; label: string };

/** Numbered roadmap timeline with an explicit current-stage cue. */
export function RoadmapTimeline({ items, label }: RoadmapTimelineProps) {
  return <div className="timeline" role="list" aria-label={label}>
    {items.map((item) => <article className="timeline-step" role="listitem" key={item.id}>
      <span className="timeline-index">{item.number}</span>
      <div>
        <span className={`timeline-tag${item.current ? " timeline-first" : ""}`}>{item.status}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </article>)}
  </div>;
}
