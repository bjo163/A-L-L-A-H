"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Icon, Switch } from "@empire/ui";
import type { PortalLanguage } from "../lib/i18n";

const labels = {
  id: { home: "Beranda", ecosystem: "Ekosistem", systems: "Atlas Sistem", roadmap: "Peta Jalan", github: "GitHub", navigation: "Navigasi utama", open: "Buka menu", close: "Tutup menu", language: "Pilih bahasa", loading: "Mengganti bahasa", theme: "Tema tampilan", light: "Terang", dark: "Gelap" },
  en: { home: "Home", ecosystem: "Ecosystem", systems: "System Atlas", roadmap: "Roadmap", github: "GitHub", navigation: "Primary navigation", open: "Open menu", close: "Close menu", language: "Choose language", loading: "Changing language", theme: "Appearance theme", light: "Light", dark: "Dark" },
} as const;

const links = [
  { key: "home", href: "/", path: "/" },
  { key: "ecosystem", href: "/#ekosistem", path: "/" },
  { key: "systems", href: "/systems", path: "/systems" },
  { key: "roadmap", href: "/roadmap", path: "/roadmap" },
  { key: "github", href: "https://github.com/bjo163/empire-of-the-light", external: true },
] as const;

export function PrimaryNavigation({ language }: { language: PortalLanguage }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [languagePending, setLanguagePending] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const copy = labels[language];

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setLanguagePending(false);
  }, [language]);

  useEffect(() => {
    const saved = window.localStorage.getItem("eol-theme");
    const current = saved === "light" ? "light" : "dark";
    setTheme(current);
    document.documentElement.dataset.theme = current;
  }, []);

  function changeTheme(isLight: boolean) {
    const next = isLight ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("eol-theme", next);
  }

  function changeLanguage(nextLanguage: PortalLanguage) {
    if (nextLanguage === language) return;
    document.cookie = `eol-language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    setLanguagePending(true);
    startTransition(() => router.refresh());
  }

  return (
    <nav className={`portal-nav${open ? " is-open" : ""}`} aria-label={copy.navigation}>
      <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="primary-navigation-links" aria-label={open ? copy.close : copy.open} onClick={() => setOpen((value) => !value)}>
        <span className="nav-toggle-icon" aria-hidden="true"><i/><i/><i/></span>
        <span>{open ? copy.close : copy.open}</span>
      </button>
      <div className="nav-links" id="primary-navigation-links">
        {links.map((link) => {
          const current = "external" in link ? false : link.key === "ecosystem"
            ? pathname === "/" && (hash === "#ekosistem" || hash === "#arsy")
            : link.key === "home" ? pathname === "/" && !hash : pathname === link.path;
          const label = "key" in link ? copy[link.key] : copy.github;
          const active = "key" in link && current;
          return (
            <Link href={link.href} key={link.key} aria-current={active ? "page" : undefined} aria-label={label} onClick={() => setOpen(false)} {...("external" in link ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {label}{"external" in link && <Icon name="externalLink" size={13} />}
            </Link>
          );
        })}
        <span className="nav-divider" aria-hidden="true"/>
        <div className="language-switch" role="group" aria-label={copy.language} aria-busy={pending || languagePending}>
          <button type="button" aria-pressed={language === "id"} onClick={() => changeLanguage("id")} disabled={pending || languagePending}>ID</button>
          <span aria-hidden="true">/</span>
          <button type="button" aria-pressed={language === "en"} onClick={() => changeLanguage("en")} disabled={pending || languagePending}>EN</button>
          {(pending || languagePending) && <span className="language-status" role="status">{copy.loading}</span>}
        </div>
        <Switch className="theme-toggle" checked={theme === "light"} onCheckedChange={changeTheme} aria-label={copy.theme}>
          <span className="theme-toggle-icon" aria-hidden="true"><Icon name={theme === "dark" ? "moon" : "sun"} size={15}/></span>
          <span className="theme-toggle-label">{theme === "dark" ? copy.dark : copy.light}</span>
        </Switch>
      </div>
    </nav>
  );
}
