"use client";

import { useRef, useState, type MouseEvent, type ReactNode, type KeyboardEvent } from "react";
import { Button } from "../primitives/Button";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "../primitives/Icon";
import { classNames } from "../primitives/classNames";
import { SkipLink } from "./Navigation";
import { ThemeControl } from "./ThemeControl";
import { focusNavigationHeading } from "./navigationFocus";

export type WorkspaceShellProps = {
  navigation: ReactNode;
  header: ReactNode;
  appearanceControl?: ReactNode;
  children: ReactNode;
  skipLabel?: ReactNode;
  menuLabel?: string;
  closeLabel?: string;
  mainId?: string;
  className?: string;
};

/** Structural shell for authenticated workspaces; navigation, permissions, and workflows remain app supplied. */
export function WorkspaceShell({
  navigation, header, appearanceControl, children, skipLabel = "Skip to main content", menuLabel = "Open navigation", closeLabel = "Close navigation", mainId = "main-content", className,
}: WorkspaceShellProps) {
  const themeControl = appearanceControl ?? <ThemeControl label="Appearance theme" lightLabel="Light" darkLabel="Dark" lightIcon={<SunIcon size={15} />} darkIcon={<MoonIcon size={15} />} />;
  const [navigationOpen, setNavigationOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const navigationId = `${mainId}-navigation`;
  const closeNavigation = () => {
    setNavigationOpen(false);
    toggleRef.current?.focus();
  };
  const handleNavigationClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element) || !event.target.closest("a, button")) return;
    if (window.matchMedia("(max-width: 760px)").matches) setNavigationOpen(false);
    requestAnimationFrame(() => {
      focusNavigationHeading(mainRef.current, document.querySelector<HTMLElement>(".eol-auth-layout h1"));
    });
  };
  const handleEscape = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && navigationOpen && window.matchMedia("(max-width: 760px)").matches) {
      event.preventDefault();
      closeNavigation();
    }
  };

  return <div className={classNames("eol-workspace-shell", className)}>
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
      {navigationOpen ? <CloseIcon size={16} /> : <MenuIcon size={16} />}
      {navigationOpen ? closeLabel : menuLabel}
    </Button>
    <div id={navigationId} className="eol-workspace-shell__navigation" data-open={navigationOpen} onClick={handleNavigationClick} onKeyDown={handleEscape}>
      {navigation}
    </div>
    <main id={mainId} ref={mainRef} tabIndex={-1}>
      <div className="eol-workspace-shell__header-frame">
        {header}
        <div className="eol-workspace-shell__appearance">{themeControl}</div>
      </div>
      {children}
    </main>
  </div>;
}
