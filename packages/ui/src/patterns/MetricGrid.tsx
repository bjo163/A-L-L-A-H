import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import type { BadgeTone } from "../primitives/Badge";

export type MetricItem = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: BadgeTone;
};

export type MetricGridProps = HTMLAttributes<HTMLDivElement> & {
  items: MetricItem[];
  columns?: 2 | 3 | 4;
  density?: "comfortable" | "compact";
};

/** Shared operational metrics. Business meaning and status mapping stay with the consumer. */
export function MetricGrid({ items, columns = 3, density = "comfortable", className, ...props }: MetricGridProps) {
  return (
    <div
      className={classNames("eol-metric-grid", `eol-metric-grid--${density}`, className)}
      data-columns={columns}
      {...props}
    >
      {items.map((item, index) => (
        <article className="eol-metric-grid__item" data-tone={item.tone ?? "neutral"} key={index}>
          <span className="eol-metric-grid__label">{item.label}</span>
          <strong className="eol-metric-grid__value">{item.value}</strong>
          {item.detail != null && <span className="eol-metric-grid__detail">{item.detail}</span>}
        </article>
      ))}
    </div>
  );
}
