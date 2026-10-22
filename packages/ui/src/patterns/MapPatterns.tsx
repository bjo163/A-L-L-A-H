import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "../primitives/Badge";
import { Button } from "../primitives/Button";
import { CloseIcon } from "../primitives/Icon";
import { Panel } from "../primitives/Panel";

export type MapFrameState = "ready" | "loading" | "empty" | "stale" | "error" | "unavailable" | "webgl-unavailable";

const stateLabels: Record<MapFrameState, string> = {
  ready: "Map ready",
  loading: "Loading map",
  empty: "No map data",
  stale: "Map data may be out of date",
  error: "Map failed to load",
  unavailable: "Map unavailable",
  "webgl-unavailable": "Map rendering unavailable",
};

export function MapFrame({
  title,
  state = "ready",
  stateTitle,
  description,
  source,
  updatedAt,
  toolbar,
  className,
  canvas,
  children,
}: {
  title: ReactNode;
  state?: MapFrameState;
  stateTitle?: ReactNode;
  description?: ReactNode;
  source?: ReactNode;
  updatedAt?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  canvas?: ReactNode;
  children?: ReactNode;
}) {
  const needsFallback = state !== "ready";
  const stateRole = state === "error" || state === "webgl-unavailable" ? "alert" : "status";
  return (
    <section
      className={["eol-map-frame", className].filter(Boolean).join(" ")}
      aria-label={typeof title === "string" ? title : "Map"}
      aria-busy={state === "loading"}
      data-state={state}
    >
      <header className="eol-map-frame__header">
        <h3 className="eol-map-frame__title">{title}</h3>
        {toolbar && <div className="eol-map-frame__toolbar">{toolbar}</div>}
      </header>
      <div className="eol-map-frame__canvas">
        {canvas}
        {needsFallback && (
          <div className="eol-map-frame__fallback" role={stateRole}>
            <strong>{stateTitle ?? stateLabels[state]}</strong>
            {description && <p>{description}</p>}
          </div>
        )}
      </div>
      {children}
      {(source || updatedAt) && (
        <footer className="eol-map-frame__footer">
          {source && <span><strong>Source</strong> {source}</span>}
          {updatedAt && <span><strong>Updated</strong> {updatedAt}</span>}
        </footer>
      )}
    </section>
  );
}

export type MapStatus = "nominal" | "advisory" | "alert" | "critical" | "unavailable";

export type MapLegendItem = {
  status: MapStatus;
  label: ReactNode;
};

export function MapLegend({
  items,
  attribution,
}: {
  items: readonly MapLegendItem[];
  attribution?: ReactNode;
}) {
  return (
    <div className="eol-map-legend" role="group" aria-label="Map status legend">
      {items.map(({ status, label }) => (
        <span className="eol-map-legend__item" data-status={status} key={status}>
          <span className="eol-map-legend__swatch" aria-hidden="true" />
          <span>{label}</span>
        </span>
      ))}
      {attribution && <span className="eol-map-legend__attribution">{attribution}</span>}
    </div>
  );
}

export type RegionSummaryMetric = {
  label: ReactNode;
  value: ReactNode;
};

export function RegionSummary({
  name,
  eyebrow,
  status,
  tone,
  metrics,
  onClear,
  clearLabel,
}: {
  name: ReactNode;
  eyebrow?: ReactNode;
  status: ReactNode;
  tone: BadgeTone;
  metrics: readonly RegionSummaryMetric[];
  onClear?: () => void;
  clearLabel?: ReactNode;
}) {
  return (
    <Panel as="section" className="eol-map-region-summary" aria-label="Selected region">
      <div className="eol-map-region-summary__header">
        <div className="eol-map-region-summary__identity">
          {eyebrow && <p className="eol-map-region-summary__eyebrow">{eyebrow}</p>}
          <h3 className="eol-map-region-summary__title">{name}</h3>
        </div>
        <Badge tone={tone}>{status}</Badge>
      </div>
      <dl className="eol-map-region-summary__metrics">
        {metrics.map((metric, index) => (
          <div className="eol-map-region-summary__metric" key={index}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      {onClear && (
        <Button
          className="eol-map-region-summary__clear"
          variant="quiet"
          onClick={onClear}
        >
          <CloseIcon size={14} />
          {clearLabel}
        </Button>
      )}
    </Panel>
  );
}
