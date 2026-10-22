"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ResponsiveNavigation, ThemeControl } from "@empire/ui/client";
import { ExternalLinkIcon, SunIcon, MoonIcon } from "@empire/ui";
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
  const [pending, startTransition] = useTransition();
  const [languagePending, setLanguagePending] = useState(false);
  const copy = labels[language];

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    setLanguagePending(false);
  }, [language]);

  function changeLanguage(nextLanguage: PortalLanguage) {
    if (nextLanguage === language) return;
    document.cookie = `eol-language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    setLanguagePending(true);
    startTransition(() => router.refresh());
  }

  return (
    <ResponsiveNavigation label={copy.navigation} openLabel={copy.open} closeLabel={copy.close} resetKey={pathname}>
        {links.map((link) => {
          const current = "external" in link ? false : link.key === "ecosystem"
            ? pathname === "/" && (hash === "#ekosistem" || hash === "#arsy")
            : link.key === "home" ? pathname === "/" && !hash : pathname === link.path;
          const label = "key" in link ? copy[link.key] : copy.github;
          const active = "key" in link && current;
          return (
            <Link href={link.href} key={link.key} aria-current={active ? "page" : undefined} aria-label={label} {...("external" in link ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {label}{"external" in link && <ExternalLinkIcon size={13} />}
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
        <ThemeControl label={copy.theme} lightLabel={copy.light} darkLabel={copy.dark} lightIcon={<SunIcon size={15}/>} darkIcon={<MoonIcon size={15}/>} />
    </ResponsiveNavigation>
  );
}
