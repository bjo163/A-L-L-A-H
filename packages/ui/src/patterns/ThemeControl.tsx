"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Switch } from "../primitives/Switch";
import { classNames } from "../primitives/classNames";

export type ThemeControlProps = {
  label: string;
  lightLabel: string;
  darkLabel: string;
  lightIcon?: ReactNode;
  darkIcon?: ReactNode;
  storageKey?: string;
  defaultTheme?: "dark" | "light";
  className?: string;
  onThemeChange?: (theme: "dark" | "light") => void;
};

function applyTheme(theme: "dark" | "light", storageKey: string, persist: boolean) {
  document.documentElement.dataset.theme = theme;
  if (!persist) return;
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Keep the selected theme for this page even when browser storage is unavailable.
  }
}

export function ThemeControl({
  label, lightLabel, darkLabel, lightIcon, darkIcon, storageKey = "eol-theme", defaultTheme = "dark", className, onThemeChange,
}: ThemeControlProps) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved === "light" || saved === "dark" ? saved : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    let next: "dark" | "light" = defaultTheme;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") next = saved;
    } catch {
      // Keep the configured default when browser storage is unavailable.
    }
    setTheme(next);
    applyTheme(next, storageKey, false);
    onThemeChange?.(next);
  }, [defaultTheme, storageKey, onThemeChange]);

  function changeTheme(isLight: boolean) {
    const next = isLight ? "light" : "dark";
    setTheme(next);
    applyTheme(next, storageKey, true);
    onThemeChange?.(next);
  }

  return <Switch className={classNames("theme-toggle", className)} checked={theme === "light"} onCheckedChange={changeTheme} aria-label={label}>
    <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? darkIcon : lightIcon}</span>
    <span className="theme-toggle-label">{theme === "dark" ? darkLabel : lightLabel}</span>
  </Switch>;
}
