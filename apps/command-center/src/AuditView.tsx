import type { ReactNode } from "react";
import { Badge, EmptyState, EventList, Pagination } from "@empire/ui";

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
    <div className="section-head"><div><span className="eyebrow">ILLIYYIN LEDGER</span><h2>Recorded activity</h2></div><Pagination className="audit-controls" page={page} totalPages={totalPages} onPageChange={onPageChange} previousLabel="Newer audit events" nextLabel="Older audit events" /></div>
    <EventList className="event-list event-list-large" events={events} empty={<EmptyState title="No matching audit events" description="Events are written as operators take actions." />} />
  </section>;
}
