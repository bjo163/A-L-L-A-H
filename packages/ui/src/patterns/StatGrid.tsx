import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type StatItem = { value: ReactNode; label: ReactNode; detail?: ReactNode };
export type StatGridProps = HTMLAttributes<HTMLDivElement> & { items: StatItem[]; itemClassName?: string };

export function StatGrid({ items, className, itemClassName, ...props }: StatGridProps) {
  return (
    <div className={classNames("eol-stat-grid", className)} {...props}>
      {items.map((item, index) => (
        <div className={classNames("eol-stat-grid__item", itemClassName)} key={index}>
          <strong className="eol-stat-grid__value">{item.value}</strong>
          <span className="eol-stat-grid__label">{item.label}</span>
          {item.detail && <span className="eol-stat-grid__detail">{item.detail}</span>}
        </div>
      ))}
    </div>
  );
}
