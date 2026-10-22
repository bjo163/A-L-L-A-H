import type { WebLanguage } from "../lib/i18n";
import { Container, MangaLoadingState } from "@empire/ui";

export function RouteLoading({ language, section }: { language: WebLanguage; section?: string }) {
  const label = language === "en" ? `Loading ${section ?? "website"}` : `Memuat ${section ?? "situs"}`;
  return <Container>
    <MangaLoadingState
      eyebrow="A-L-L-A-H · WEB"
      label={label}
      sfx={language === "en" ? "ZIP!" : "WUSSH!"}
    />
  </Container>;
}
