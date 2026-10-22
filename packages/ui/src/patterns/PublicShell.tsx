import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import { SkipLink } from "./Navigation";

export type PublicShellProps = {
  brand: ReactNode;
  navigation: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footerBrand: ReactNode;
  footerContent: ReactNode;
  skipLabel?: ReactNode;
  footerLabel?: string;
  mainId?: string;
  className?: string;
};

/** Structural shell for public product pages. Product copy and routing stay in the consumer. */
export function PublicShell({
  brand, navigation, action, children, footerBrand, footerContent,
  skipLabel = "Skip to main content", footerLabel = "Footer navigation", mainId = "main-content", className,
}: PublicShellProps) {
  return <div className={classNames("site-shell", className)}>
    <SkipLink targetId={mainId}>{skipLabel}</SkipLink>
    <header className="site-header">
      {brand}
      {navigation}
      {action}
    </header>
    <main id={mainId} tabIndex={-1}>{children}</main>
    <footer className="site-footer">
      <div className="footer-brand">{footerBrand}</div>
      <nav className="footer-right" aria-label={footerLabel}>{footerContent}</nav>
    </footer>
  </div>;
}
