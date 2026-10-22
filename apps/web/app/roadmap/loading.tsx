import { RouteLoading } from "../../components/RouteLoading";
import { getWebLanguage } from "../../lib/i18n";

export default async function Loading() {
  const language = await getWebLanguage();
  return <RouteLoading language={language} section={language === "en" ? "roadmap" : "peta jalan"} />;
}
