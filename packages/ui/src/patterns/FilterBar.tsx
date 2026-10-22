import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type FilterBarProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode; resultLabel?: ReactNode; clearAction?: ReactNode };

export function FilterBar({ children, resultLabel, clearAction, className, ...props }: FilterBarProps) {
  return <div {...props} className={classNames("eol-filter-bar", className)}><div className="eol-filter-bar__controls">{children}</div>{(resultLabel || clearAction) && <div className="eol-filter-bar__meta">{resultLabel && <span>{resultLabel}</span>}{clearAction}</div>}</div>;
}
