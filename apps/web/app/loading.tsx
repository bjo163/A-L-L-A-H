import { RouteLoading } from "../components/RouteLoading";
import { getWebLanguage } from "../lib/i18n";

export default async function Loading() {
  return <RouteLoading language={await getWebLanguage()} />;
}
