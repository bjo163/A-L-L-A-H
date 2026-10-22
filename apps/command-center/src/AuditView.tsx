import type { ReactNode } from "react";
import { Badge, EmptyState, EventList, Pagination, SectionHeading } from "@empire/ui";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: ReactNode;
  details?: ReactNode;
};

type AuditViewProps = {
  events: readonly AuditEvent[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function AuditView({ events, page, totalPages, onPageChange }: AuditViewProps) {
  return <section>
    <SectionHeading layout="compact" eyebrow="ILLIYYIN LEDGER" title="Recorded activity" aside={<Pagination className="audit-controls" page={page} totalPages={totalPages} onPageChange={onPageChange} previousLabel="Newer audit events" nextLabel="Older audit events" />} />
    <EventList className="event-list event-list-large" events={events} empty={<EmptyState title="No matching audit events" description="Events are written as operators take actions." />} />
  </section>;
}
