export type ThemeBootstrapProps = { defaultTheme?: "dark" | "light" };

/** Apply the stored semantic theme before hydration to avoid a first-paint flash. */
export function ThemeBootstrap({ defaultTheme = "dark" }: ThemeBootstrapProps) {
  const script = `try{var saved=localStorage.getItem("eol-theme");document.documentElement.dataset.theme=saved==="light"||saved==="dark"?saved:"${defaultTheme}"}catch(e){document.documentElement.dataset.theme="${defaultTheme}"}`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
