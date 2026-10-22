import type { ReactNode } from "react";
import { Disclosure } from "./Disclosure";
import { classNames } from "../primitives/classNames";

export type EventItem = { id: string; timestamp: ReactNode; actor: ReactNode; action: ReactNode; details?: ReactNode };
export type EventListProps = { events: readonly EventItem[]; empty?: ReactNode; className?: string };

export function EventList({ events, empty = "No activity", className }: EventListProps) {
  return <ol className={classNames("eol-event-list", className)}>{events.length ? events.map((event) => <li key={event.id} className="eol-event-list__item"><time>{event.timestamp}</time><div className="eol-event-list__body"><strong>{event.actor}</strong><span>{event.action}</span>{event.details && <Disclosure summary="Details">{event.details}</Disclosure>}</div></li>) : <li className="eol-event-list__empty">{empty}</li>}</ol>;
}
