import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import type { BadgeTone } from "../primitives/Badge";

export type MetricItem = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  freshness?: ReactNode;
  tone?: BadgeTone;
};

export type MetricGridProps = HTMLAttributes<HTMLDivElement> & {
  items: MetricItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  profile?: "operational" | "editorial";
  density?: "comfortable" | "compact";
};

/** Shared operational metrics. Business meaning and status mapping stay with the consumer. */
export function MetricGrid({ items, columns, profile = "operational", density = "comfortable", className, ...props }: MetricGridProps) {
  const resolvedColumns = columns ?? (profile === "editorial" ? 4 : 3);
  return (
    <div
      className={classNames("eol-metric-grid", `eol-metric-grid--${density}`, `eol-metric-grid--${profile}`, className)}
      data-columns={resolvedColumns}
      {...props}
    >
      {items.map((item, index) => (
        <article className="eol-metric-grid__item" data-tone={item.tone ?? "neutral"} key={index}>
          {profile === "editorial" && <strong className="eol-metric-grid__value">{item.value}</strong>}
          <span className="eol-metric-grid__label">{item.label}</span>
          {profile === "operational" && <strong className="eol-metric-grid__value">{item.value}</strong>}
          {item.detail != null && <span className="eol-metric-grid__detail">{item.detail}</span>}
          {item.freshness != null && <span className="eol-metric-grid__freshness">{item.freshness}</span>}
        </article>
      ))}
    </div>
  );
}
