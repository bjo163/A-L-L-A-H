import { RouteLoading } from "../components/RouteLoading";
import { getPortalLanguage } from "../lib/i18n";

export default async function Loading() {
  return <RouteLoading language={await getPortalLanguage()} />;
}
