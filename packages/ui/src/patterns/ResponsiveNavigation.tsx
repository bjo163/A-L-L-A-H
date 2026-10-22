"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type ResponsiveNavigationProps = {
  label: string;
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
  resetKey?: string | number;
  className?: string;
  toggleClassName?: string;
  linksClassName?: string;
};

/** Shared responsive navigation disclosure; route labels and links remain consumer-owned. */
export function ResponsiveNavigation({
  label, openLabel, closeLabel, children, resetKey, className, toggleClassName, linksClassName,
}: ResponsiveNavigationProps) {
  const [open, setOpen] = useState(false);
  const linksId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    setOpen(false);
  }, [resetKey]);

  useEffect(() => {
    if (wasOpen.current && !open) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  function closeOnLink(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  }

  return <nav className={classNames("portal-nav", open && "is-open", className)} aria-label={label}>
    <button ref={toggleRef} className={classNames("nav-toggle", toggleClassName)} type="button" aria-expanded={open} aria-controls={linksId} aria-label={open ? closeLabel : openLabel} onClick={() => setOpen((value) => !value)}>
      <span className="nav-toggle-icon" aria-hidden="true"><i/><i/><i/></span>
      <span>{open ? closeLabel : openLabel}</span>
    </button>
    <div className={classNames("nav-links", linksClassName)} id={linksId} onClick={closeOnLink}>{children}</div>
  </nav>;
}
