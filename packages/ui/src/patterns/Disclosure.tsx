import type { DetailsHTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type DisclosureProps = Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "children"> & { summary: ReactNode; children?: ReactNode; className?: string };

export function Disclosure({ summary, children, className, ...props }: DisclosureProps) {
  return <details {...props} className={classNames("eol-disclosure", className)}><summary>{summary}</summary><div className="eol-disclosure__content">{children}</div></details>;
}
