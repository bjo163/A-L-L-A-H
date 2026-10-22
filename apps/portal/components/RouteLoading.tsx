import type { PortalLanguage } from "../lib/i18n";
import { MangaLoadingState } from "@empire/ui";

export function RouteLoading({ language, section }: { language: PortalLanguage; section?: string }) {
  const label = language === "en" ? `Loading ${section ?? "portal"}` : `Memuat ${section ?? "portal"}`;
  return <MangaLoadingState
    className="container"
    eyebrow="A-L-L-A-H · PORTAL"
    label={label}
    sfx={language === "en" ? "ZIP!" : "WUSSH!"}
  />;
}
