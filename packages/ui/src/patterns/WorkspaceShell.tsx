"use client";

import { useRef, useState, type MouseEvent, type ReactNode, type KeyboardEvent } from "react";
import { Button } from "../primitives/Button";
import { Icon } from "../primitives/Icon";
import { classNames } from "../primitives/classNames";
import { SkipLink } from "./Navigation";

export type WorkspaceShellProps = {
  navigation: ReactNode;
  header: ReactNode;
  children: ReactNode;
  skipLabel?: ReactNode;
  menuLabel?: string;
  closeLabel?: string;
  mainId?: string;
  className?: string;
};

/** Structural shell for authenticated workspaces; navigation, permissions, and workflows remain app supplied. */
export function WorkspaceShell({
  navigation, header, children, skipLabel = "Skip to main content", menuLabel = "Open navigation", closeLabel = "Close navigation", mainId = "main-content", className,
}: WorkspaceShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navigationId = `${mainId}-navigation`;
  const closeNavigation = () => {
    setNavigationOpen(false);
    toggleRef.current?.focus();
  };
  const handleNavigationClick = (event: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(max-width: 760px)").matches && event.target instanceof Element && event.target.closest("a, button")) closeNavigation();
  };
  const handleEscape = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && navigationOpen && window.matchMedia("(max-width: 760px)").matches) {
      event.preventDefault();
      closeNavigation();
    }
  };

  return <div className={classNames("shell", className)}>
    <SkipLink targetId={mainId}>{skipLabel}</SkipLink>
    <Button
      ref={toggleRef}
      className="eol-workspace-shell__toggle"
      variant="secondary"
      size="sm"
      aria-expanded={navigationOpen}
      aria-controls={navigationId}
      aria-label={navigationOpen ? closeLabel : menuLabel}
      onClick={() => setNavigationOpen((open) => !open)}
      onKeyDown={handleEscape}
    >
      <Icon name={navigationOpen ? "close" : "menu"} size={16} />
      {navigationOpen ? closeLabel : menuLabel}
    </Button>
    <div id={navigationId} className="eol-workspace-shell__navigation" data-open={navigationOpen} onClick={handleNavigationClick} onKeyDown={handleEscape}>
      {navigation}
    </div>
    <main id={mainId} tabIndex={-1}>
      {header}
      {children}
    </main>
  </div>;
}
