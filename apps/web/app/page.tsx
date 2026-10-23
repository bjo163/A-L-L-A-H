import { getWebLanguage } from "../lib/i18n";
import { MoonwitnessExperience } from "./MoonwitnessExperience";

export default async function Home() {
  const language = await getWebLanguage();
  return <MoonwitnessExperience language={language} />;
}
