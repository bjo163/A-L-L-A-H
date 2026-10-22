"use client";

import { useEffect, useRef } from "react";
import { focusNavigationAnchor, focusNavigationHeading } from "./navigationFocus";

export type PageNavigationFocusProps = {
  /** Consumer-owned route key; changing it focuses the new page heading. */
  navigationKey: string | number;
  mainSelector?: string;
};

/** Shared focus behavior for client-routed public pages and in-page hash navigation. */
export function PageNavigationFocus({ navigationKey, mainSelector = "main" }: PageNavigationFocusProps) {
  const previousKey = useRef(navigationKey);

  useEffect(() => {
    if (previousKey.current === navigationKey) return;
    previousKey.current = navigationKey;
    const frame = requestAnimationFrame(() => {
      if (window.location.hash) {
        focusNavigationAnchor(window.location.hash);
      } else {
        focusNavigationHeading(document.querySelector<HTMLElement>(mainSelector));
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [mainSelector, navigationKey]);

  useEffect(() => {
    let frame = 0;
    const scheduleHashFocus = (hash: string) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => focusNavigationAnchor(hash));
    };
    const focusHashDestination = () => scheduleHashFocus(window.location.hash);
    const focusClickedHash = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname !== window.location.pathname || destination.search !== window.location.search) return;
      scheduleHashFocus(destination.hash);
    };
    window.addEventListener("hashchange", focusHashDestination);
    document.addEventListener("click", focusClickedHash);
    scheduleHashFocus(window.location.hash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", focusHashDestination);
      document.removeEventListener("click", focusClickedHash);
    };
  }, []);

  return null;
}
