import type { ReactNode } from "react";
import { Badge } from "../primitives/Badge";
import type { BadgeTone } from "../primitives/Badge";
import { ActivityIcon } from "../primitives/Icon";

export type TelemetryEvent = {
  id: string;
  title: ReactNode;
  severity: ReactNode;
  severityTone: BadgeTone;
  region: ReactNode;
  sourceTag: ReactNode;
  detail: ReactNode;
  source: ReactNode;
  category: ReactNode;
  timestamp: string;
  timestampLabel: ReactNode;
};

export type TelemetryEventListProps = {
  events: readonly TelemetryEvent[];
  empty: ReactNode;
};

/** Shared event feed presentation; filtering, severity mapping, and copy stay with the consumer. */
export function TelemetryEventList({ events, empty }: TelemetryEventListProps) {
  if (!events.length) return <>{empty}</>;
  return (
    <div className="event-list event-list-large">
      {events.map((event) => (
        <article key={event.id} className="event-row event-row-expanded">
          <span className="event-marker"><ActivityIcon size={16} /></span>
          <div className="event-main">
            <div className="event-title">
              <strong>{event.title}</strong>
              <Badge tone={event.severityTone}>{event.severity}</Badge>
              <Badge tone="neutral">{event.region}</Badge>
              <Badge tone="info">{event.sourceTag}</Badge>
            </div>
            <p className="world-event-detail">{event.detail}</p>
            <small>Source: {event.source} · Category: {event.category}</small>
          </div>
          <time dateTime={event.timestamp}>{event.timestampLabel}</time>
        </article>
      ))}
    </div>
  );
}
