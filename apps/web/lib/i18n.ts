import { cookies } from "next/headers";

export type WebLanguage = "id" | "en";

export async function getWebLanguage(): Promise<WebLanguage> {
  const cookieStore = await cookies();
  return cookieStore.get("eol-language")?.value === "en" ? "en" : "id";
}

export function text(language: WebLanguage, id: string, en: string): string {
  return language === "en" ? en : id;
}
