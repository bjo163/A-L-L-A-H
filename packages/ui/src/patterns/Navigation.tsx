import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
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

export type NavItemProps = ButtonHTMLAttributes<HTMLButtonElement> & { current?: boolean; badge?: ReactNode; icon?: ReactNode };
export function NavItem({ current = false, badge, icon, className, children, ...props }: NavItemProps) {
  return <button {...props} type={props.type ?? "button"} className={classNames("eol-nav-item", className)} aria-current={current ? "page" : undefined}><span className="eol-nav-item__icon" aria-hidden={icon ? true : undefined}>{icon}</span><span>{children}</span>{badge !== undefined && <em>{badge}</em>}</button>;
}

export type NavGroupProps = HTMLAttributes<HTMLDivElement> & { label?: ReactNode };
export function NavGroup({ label, children, className, ...props }: NavGroupProps) {
  return <div {...props} className={classNames("eol-nav-group", className)}>{label && <p className="eol-nav-group__label">{label}</p>}{children}</div>;
}
