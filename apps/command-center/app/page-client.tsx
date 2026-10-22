"use client";

import { useEffect, useState } from "react";
import { bootstrapTheme } from "@empire/ui";
import { empireFaviconSvg } from "@empire/ui/brand-assets";
import { App } from "../src/App";

export function CommandCenterClient() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapTheme();
    const faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement("link");
    faviconLink.rel = "icon";
    faviconLink.type = "image/svg+xml";
    faviconLink.href = `data:image/svg+xml,${encodeURIComponent(empireFaviconSvg)}`;
    if (!faviconLink.isConnected) document.head.appendChild(faviconLink);
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue("--eol-color-background").trim();
    if (themeColor) document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", themeColor);
    setReady(true);
  }, []);

  return ready ? <App /> : <main aria-busy="true" className="loading-screen">Memuat Command Center…</main>;
}
