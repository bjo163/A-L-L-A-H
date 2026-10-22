"use client";

import { useEffect, useState } from "react";
import { Badge, MangaEffect, Tabs } from "@empire/ui";
import type { TabItem, TabsOrientation } from "@empire/ui";
import type { PortalLanguage } from "../lib/i18n";

const itemsFor = (language: PortalLanguage) => {
const en = language === "en";
return [
  { id: "arsy", code: "SYS 01", name: "ARSY · AGENCY", kind: "Agent Reality System Yard & Orchestration", stage: en?"DESIGN":"RANCANGAN", description: en?"A proposed agency layer that assigns agents by role and mandate, connects tools and sources, distributes work, manages runtime context, and coordinates handoffs and human checkpoints. AI models are a foundational capability agents can use; ARSY orchestrates the wider system and its work traces.":"Rancangan lapisan agency yang mengatur agen berdasarkan peran dan mandat, menghubungkan alat serta sumber, membagi tugas, mengelola konteks eksekusi, dan mengatur handoff serta checkpoint manusia. Model AI adalah kemampuan dasar yang dapat dipakai agen; ARSY mengorkestrasi keseluruhan sistem dan jejak kerjanya.", inputs: en?["Mandate and mission scope","Agent, tool, and source registry","Runtime environment and policies"]:["Mandat dan lingkup misi", "Registry agen, alat, dan sumber", "Lingkungan eksekusi dan kebijakan"], outputs: en?["Orchestration plan","Task and handoff trace","Evidence package for review"]:["Rencana orkestrasi", "Jejak tugas dan handoff", "Paket bukti untuk tinjauan"], accent: "#49d8bd" },
  { id: "heliogrid", code: "SYS 02", name: en?"HELIOGRID · ENERGY":"HELIOGRID · ENERGI", kind: en?"Power & measurement":"Daya & pengukuran", stage: en?"DESIGN":"RANCANGAN", description: en?"A proposed digital twin for monitoring grid, solar, batteries, and server power. Protonic fuel-cell studies are research, not free-energy generation.":"Usulan kembaran digital untuk memantau jaringan, surya, baterai, dan daya server. Studi sel bahan bakar protonik adalah riset, bukan pembangkit energi gratis.", inputs: en?["Certified meters","Grid / solar telemetry","Battery status"]:["Meter tersertifikasi", "Telemetri jaringan / surya", "Status baterai"], outputs: en?["Energy budget","Measured kWh","Safety alerts"]:["Anggaran energi", "kWh terukur", "Peringatan keselamatan"], accent: "#d7f75b" },
  { id: "qrealm", code: "SYS 03", name: en?"Q-REALM · COMPUTING":"Q-REALM · KOMPUTASI", kind: en?"Quantum research":"Riset kuantum", stage: en?"RESEARCH":"RISET", description: en?"Repeatable quantum-circuit simulation and optional comparisons with external QPUs against classical methods. No invented quantum advantage; this project does not own or operate quantum hardware.":"Simulasi sirkuit kuantum yang dapat diulang dan pembandingan QPU eksternal opsional dengan metode klasik. Tidak menjanjikan keunggulan kuantum (no invented quantum advantage); proyek ini tidak memiliki atau mengoperasikan perangkat kuantum.", inputs: en?["Problem definition","Classical baseline","Approved provider"]:["Definisi masalah", "Pembanding klasik", "Penyedia yang disetujui"], outputs: en?["Circuit metrics","Accuracy comparison","Experiment evidence"]:["Metrik sirkuit", "Perbandingan akurasi", "Bukti eksperimen"], accent: "#9375ff" },
  { id: "forge", code: "SYS 04", name: "MATERIAL FORGE", kind: en?"Materials discovery":"Penemuan material", stage: en?"DESIGN":"RANCANGAN", description: en?"Materials research pipeline: data licensing, DFT/simulation, candidate screening, professional laboratory testing, and independent replication.":"Alur riset material: lisensi data, DFT/simulasi, penyaringan kandidat, pengujian laboratorium profesional, dan replikasi independen.", inputs: en?["Scientific datasets","Material structures","Lab safety plan"]:["Dataset ilmiah", "Struktur material", "Rencana keselamatan lab"], outputs: en?["Simulation results","Candidate registry","Reviewable experiments"]:["Hasil simulasi", "Registry kandidat", "Eksperimen yang dapat ditinjau"], accent: "#ff6689" },
  { id: "knowledge", code: "SYS 05", name: "UNIVERSAL COSMOS", kind: en?"Knowledge & comparison":"Pengetahuan & perbandingan", stage: en?"METADATA":"METADATA", description: en?"UNILEX and Qur’an/Torah/Psalms/Gospel source families, plus planned Daoist and Shinto studies with distinct editions, provenance, and interpretations.":"UNILEX dan keluarga sumber Qur’an/Torah/Mazmur/Injil, serta kajian Daoist and Shinto (tradisi Dao dan Shinto) yang direncanakan dengan edisi, asal, dan interpretasi yang dibedakan.", inputs: en?["Edition metadata","Licensed texts","Expert review"]:["Metadata edisi", "Teks berlisensi", "Tinjauan ahli"], outputs: en?["Contextual search","Term comparison","Source citations"]:["Pencarian kontekstual", "Perbandingan istilah", "Sitasi sumber"], accent: "#56d9e8" },
  { id: "ziil", code: "SYS 06", name: en?"ZIIL · GOVERNANCE":"ZIIL · TATA KELOLA", kind: en?"Rights, review & safety":"Hak, tinjauan & keselamatan", stage: en?"FOUNDATION":"FONDASI", description: en?"Human governance, consent, risk assessment, privacy, appeals, and bounded AI actions. Software does not confer religious or divine authority.":"Tata kelola manusia, persetujuan, penilaian risiko, privasi, banding, dan tindakan AI terbatas. Perangkat lunak tidak memberi otoritas agama atau ilahi.", inputs: en?["Operator mandate","Risk evidence","Policy boundaries"]:["Mandat operator", "Bukti risiko", "Batas kebijakan"], outputs: en?["Review status","Safeguards","Audit record"]:["Status tinjauan", "Perlindungan", "Catatan audit"], accent: "#ff9a55" },
] as const;
};

type SystemItem = ReturnType<typeof itemsFor>[number];
type SystemId = SystemItem["id"];

function SystemPanel({ item, language }: { item: SystemItem; language: PortalLanguage }) {
  return (
    <MangaEffect panel className="explorer-detail" style={{ "--system-color": item.accent } as React.CSSProperties}>
      <div className="explorer-detail-top">
        <span className="panel-label">{item.kind}</span>
        <Badge className="stage-pill" tone={item.stage === "RISET" || item.stage === "RESEARCH" ? "warning" : item.stage === "FONDASI" || item.stage === "FOUNDATION" ? "success" : "info"}>
          {item.stage}
        </Badge>
      </div>
      <div className="explorer-visual" aria-hidden="true">
        <span className="explore-ring explore-ring-1" />
        <span className="explore-ring explore-ring-2" />
        <span className="explore-ring explore-ring-3" />
        <span className="explore-core">{item.code}</span>
      </div>
      <h3>{item.name}</h3>
      <p className="explorer-description">{item.description}</p>
      <div className="explorer-io">
        <div><span className="panel-label">{language === "en" ? "INPUTS" : "MASUKAN"}</span>{item.inputs.map((input) => <p key={input}>↳ {input}</p>)}</div>
        <div><span className="panel-label">{language === "en" ? "EXPECTED OUTPUTS" : "HASIL YANG DIHARAPKAN"}</span>{item.outputs.map((output) => <p key={output}>↗ {output}</p>)}</div>
      </div>
      <p className="explorer-note">{language === "en" ? "Architecture preview. Status reflects repository planning, not a live physical device." : "Pratinjau arsitektur. Status menggambarkan perencanaan repositori, bukan perangkat fisik aktif (not a live physical device)."}</p>
    </MangaEffect>
  );
}

export function Explorer({ language }: { language: PortalLanguage }) {
  const items = itemsFor(language);
  const [active, setActive] = useState<SystemId>("arsy");
  const [orientation, setOrientation] = useState<TabsOrientation>("vertical");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const updateOrientation = () => setOrientation(media.matches ? "horizontal" : "vertical");
    updateOrientation();
    media.addEventListener("change", updateOrientation);
    return () => media.removeEventListener("change", updateOrientation);
  }, []);

  const tabs: readonly TabItem<SystemId>[] = items.map((item) => ({
    value: item.id,
    label: <><span>{item.code}</span><strong>{item.name}</strong><i aria-hidden="true">↗</i></>,
    content: <SystemPanel item={item} language={language} />,
  }));

  return (
    <MangaEffect panel className="explorer">
      <Tabs
        items={tabs}
        value={active}
        onValueChange={setActive}
    label={language === "en" ? "System explorer" : "Penjelajah sistem"}
        orientation={orientation}
        className="explorer-tabs"
        listClassName="explorer-menu"
        tabClassName="explorer-tab"
        selectedTabClassName="is-active"
        panelClassName="explorer-tab-panel"
      />
    </MangaEffect>
  );
}
