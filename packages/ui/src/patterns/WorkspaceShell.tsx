import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import { SkipLink } from "./Navigation";

export type WorkspaceShellProps = {
  navigation: ReactNode;
  header: ReactNode;
  children: ReactNode;
  skipLabel?: ReactNode;
  mainId?: string;
  className?: string;
};

/** Structural shell for authenticated workspaces; navigation, permissions, and workflows remain app supplied. */
export function WorkspaceShell({
  navigation, header, children, skipLabel = "Skip to main content", mainId = "main-content", className,
}: WorkspaceShellProps) {
  return <div className={classNames("shell", className)}>
    <SkipLink targetId={mainId}>{skipLabel}</SkipLink>
    {navigation}
    <main id={mainId} tabIndex={-1}>
      {header}
      {children}
    </main>
  </div>;
}
