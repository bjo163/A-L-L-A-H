export type ThemeBootstrapProps = { defaultTheme?: "dark" | "light" };

/** Apply the shared stored preference before a client-rendered app mounts. */
export function bootstrapTheme(defaultTheme: "dark" | "light" = "dark", storageKey = "eol-theme") {
  if (typeof window === "undefined" || typeof document === "undefined") return defaultTheme;
  let theme = defaultTheme;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") theme = saved;
  } catch {
    // Use the shared default when storage is blocked or unavailable.
  }
  document.documentElement.dataset.theme = theme;
  return theme;
}

/** Apply the stored semantic theme before hydration to avoid a first-paint flash. */
export function ThemeBootstrap({ defaultTheme = "dark" }: ThemeBootstrapProps) {
  const script = `try{var saved=localStorage.getItem("eol-theme");document.documentElement.dataset.theme=saved==="light"||saved==="dark"?saved:"${defaultTheme}"}catch(e){document.documentElement.dataset.theme="${defaultTheme}"}`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
