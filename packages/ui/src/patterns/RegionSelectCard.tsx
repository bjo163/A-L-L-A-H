import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import { Badge } from "../primitives/Badge";
import type { BadgeTone } from "../primitives/Badge";
import { Icon } from "../primitives/Icon";
import { Card } from "./Card";

export type RegionSelectMetric = { label: ReactNode; value: ReactNode };
export type RegionSelectCardProps = {
  name: ReactNode;
  code: ReactNode;
  coordinates: ReactNode;
  status: ReactNode;
  tone: BadgeTone;
  metrics: readonly RegionSelectMetric[];
  selected?: boolean;
  onSelect: () => void;
};

/** Keyboard-operable selectable region summary for monitoring views. */
export function RegionSelectCard({ name, code, coordinates, status, tone, metrics, selected = false, onSelect }: RegionSelectCardProps) {
  return (
    <Card as="button" type="button" interactive selected={selected} aria-pressed={selected} className={classNames("agent-card region-node-card", selected && "region-node-card--selected")} onClick={onSelect}>
      <span className="agent-head">
        <span className="agent-symbol"><Icon name="globe" size={18} /></span>
        <Badge tone={tone}>{status}</Badge>
      </span>
      <h3>{name}</h3>
      <span className="agent-code">{code} · {coordinates}</span>
      <span className="region-node-metrics">
        {metrics.map((metric, index) => <span key={index}><span className="muted">{metric.label}:</span> <strong>{metric.value}</strong></span>)}
      </span>
    </Card>
  );
}
