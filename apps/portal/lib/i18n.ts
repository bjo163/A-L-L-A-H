import { cookies } from "next/headers";

export type PortalLanguage = "id" | "en";

export async function getPortalLanguage(): Promise<PortalLanguage> {
  const cookieStore = await cookies();
  return cookieStore.get("eol-language")?.value === "en" ? "en" : "id";
}

export function text(language: PortalLanguage, id: string, en: string): string {
  return language === "en" ? en : id;
}
