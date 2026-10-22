import { RouteLoading } from "../../components/RouteLoading";
import { getPortalLanguage } from "../../lib/i18n";

export default async function Loading() {
  const language = await getPortalLanguage();
  return <RouteLoading language={language} section={language === "en" ? "roadmap" : "peta jalan"} />;
}
