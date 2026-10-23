"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PageNavigationFocus, ResponsiveNavigation, ThemeControl } from "@empire/ui/client";
import { SunIcon, MoonIcon } from "@empire/ui";
import type { WebLanguage } from "../lib/i18n";

const labels = {
  id: { home: "Cerita", ecosystem: "Kru", systems: "Semesta", roadmap: "Sinyal", workspace: "Arsip", github: "Tentang", navigation: "Navigasi utama Moonwitness", open: "Buka menu", close: "Tutup menu", language: "Pilih bahasa", loading: "Mengganti bahasa", theme: "Tema tampilan", light: "Terang", dark: "Gelap" },
  en: { home: "Stories", ecosystem: "Crew", systems: "Universe", roadmap: "Signal", workspace: "Archive", github: "About", navigation: "Moonwitness navigation", open: "Open menu", close: "Close menu", language: "Choose language", loading: "Changing language", theme: "Appearance theme", light: "Light", dark: "Dark" },
} as const;

const links = [
  { key: "home", href: "/#stories", path: "/" },
  { key: "ecosystem", href: "/#crew", path: "/" },
  { key: "roadmap", href: "/#signal", path: "/" },
  { key: "workspace", href: "/#archive", path: "/" },
  { key: "systems", href: "/#universe", path: "/" },
  { key: "github", href: "/systems", path: "/systems" },
] as const;

export function PrimaryNavigation({ language }: { language: WebLanguage }) {
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

  function changeLanguage(nextLanguage: WebLanguage) {
    if (nextLanguage === language) return;
    document.cookie = `eol-language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    setLanguagePending(true);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <PageNavigationFocus navigationKey={pathname} />
      <ResponsiveNavigation label={copy.navigation} openLabel={copy.open} closeLabel={copy.close} resetKey={pathname}>
        {links.map((link) => {
          const current = link.href.startsWith("/#")
            ? pathname === "/" && hash === link.href.slice(1)
            : pathname === link.path;
          const label = "key" in link ? copy[link.key] : copy.github;
          const active = "key" in link && current;
          return (
            <Link href={link.href} key={link.key} aria-current={active ? "page" : undefined} aria-label={label}>
              {label}
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
    </>
  );
}
