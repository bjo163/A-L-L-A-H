import { classNames } from "../primitives/classNames";

export type DonutChartTone = "danger" | "success" | "warning" | "info" | "neutral";

export type DonutChartSegment = {
  id: string;
  label: string;
  value: number;
  tone: DonutChartTone;
};

export type DonutChartProps = {
  label: string;
  centerLabel: string;
  segments: readonly DonutChartSegment[];
  className?: string;
};

const center = 18;
const radius = 15.915;
const circumference = 100;

/** Shared SVG donut geometry and semantic token mapping; legend and data filtering stay consumer-owned. */
export function DonutChart({ label, centerLabel, segments, className }: DonutChartProps) {
  const values = segments.map((segment) => Math.max(0, Number.isFinite(segment.value) ? segment.value : 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  let precedingPercent = 0;

  const summary = segments
    .map((segment, index) => `${segment.label}: ${values[index]}`)
    .join("; ");

  return (
    <svg
      className={classNames("eol-donut-chart", className)}
      viewBox="0 0 36 36"
      role="img"
      focusable="false"
      aria-label={`${label}. ${total} ${centerLabel}. ${summary}`}
    >
      <circle className="eol-donut-chart__track" cx={center} cy={center} r={radius} fill="none" strokeWidth="3" />
      {segments.map((segment, index) => {
        const percent = total === 0 ? 0 : (values[index] / total) * circumference;
        const offset = 25 - precedingPercent;
        precedingPercent += percent;
        if (percent === 0) return null;
        return (
          <circle
            className="eol-donut-chart__segment"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth="3.2"
            strokeDasharray={`${percent} ${circumference - percent}`}
            strokeDashoffset={offset}
            data-tone={segment.tone}
            key={segment.id}
          />
        );
      })}
      <text className="eol-donut-chart__value" x={center} y="19" textAnchor="middle">{total}</text>
      <text className="eol-donut-chart__label" x={center} y="24" textAnchor="middle">{centerLabel}</text>
    </svg>
  );
}
