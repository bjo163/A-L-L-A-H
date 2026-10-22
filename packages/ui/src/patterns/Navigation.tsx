import type { AnchorHTMLAttributes, ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type BreadcrumbItem = { label: ReactNode; href?: string; current?: boolean };
export type BreadcrumbsProps = { items: readonly BreadcrumbItem[]; className?: string; label?: string };

export function Breadcrumbs({ items, className, label = "Breadcrumb" }: BreadcrumbsProps) {
  return <nav className={classNames("eol-breadcrumbs", className)} aria-label={label}><ol>{items.map((item, index) => <li key={index} aria-current={item.current ? "page" : undefined}>{item.href && !item.current ? <a href={item.href}>{item.label}</a> : item.label}</li>)}</ol></nav>;
}

export type SkipLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { targetId?: string };

export function SkipLink({ targetId = "main-content", className, children = "Skip to main content", href, ...props }: SkipLinkProps) {
  return <a {...props} className={classNames("eol-skip-link", className)} href={href ?? `#${targetId}`}>{children}</a>;
}
