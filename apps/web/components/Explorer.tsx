import { ResponsiveTabs } from "@empire/ui/client";
import { SystemDetailPanel, ArrowUpRightIcon } from "@empire/ui";
import type { TabItem } from "@empire/ui";
import { getWebSystems } from "../lib/web-systems";
import type { WebLanguage } from "../lib/i18n";

type SystemId = ReturnType<typeof getWebSystems>[number]["id"];

export function Explorer({ language }: { language: WebLanguage }) {
  const items = getWebSystems(language);

  const tabs: readonly TabItem<SystemId>[] = items.map((item) => ({
    value: item.id,
    label: <><span>{item.code}</span><strong>{item.name}</strong><ArrowUpRightIcon size={14}/></>,
    content: <SystemDetailPanel
      systemId={item.id}
      category={item.descriptor}
      status={item.statusLabel}
      statusTone={item.statusTone}
      code={item.code}
      name={item.explorerName}
      description={item.description}
      inputsLabel={language === "en" ? "INPUTS" : "MASUKAN"}
      inputs={item.inputs}
      outputsLabel={language === "en" ? "EXPECTED OUTPUTS" : "HASIL YANG DIHARAPKAN"}
      outputs={item.outputs}
      note={language === "en" ? "Architecture preview. Status reflects repository planning, not a live physical device." : "Pratinjau arsitektur. Status menggambarkan perencanaan repositori, bukan perangkat fisik aktif (not a live physical device)."}
    />,
  }));

  return <ResponsiveTabs
    items={tabs}
    defaultValue="arsy"
    label={language === "en" ? "System explorer" : "Penjelajah sistem"}
    orientationBreakpoint={800}
    containerClassName="explorer"
    className="explorer-tabs"
    listClassName="explorer-menu"
    tabClassName="explorer-tab"
    selectedTabClassName="is-active"
    panelClassName="explorer-tab-panel"
  />;
}
