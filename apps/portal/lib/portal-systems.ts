import type { DomainAccent } from "@empire/ui";
import type { IconName } from "@empire/ui";
import type { PortalLanguage } from "./i18n";

type StatusKey = "design" | "research" | "metadata" | "foundation";
type LocalizedContent = {
  descriptor: string;
  context?: string;
  summary: string;
  description: string;
  inputs: readonly string[];
  outputs: readonly string[];
};
type SystemDefinition = {
  id: string;
  index: string;
  code: string;
  name: string;
  accent: DomainAccent;
  icon: IconName;
  status: StatusKey;
  en: LocalizedContent;
  idLocale: LocalizedContent;
};

const systems: readonly SystemDefinition[] = [
  {
    id: "arsy", index: "01", code: "SYS 01", name: "ARSY", accent: "mint", icon: "agent", status: "design",
    en: {
      descriptor: "Agent Reality System Yard & Orchestration", context: "AGENCY",
      summary: "An agency layer that composes agents, tools, sources, runtime environments, and workflows. AI models are one foundational capability in the system.",
      description: "A proposed agency layer that assigns agents by role and mandate, connects tools and sources, distributes work, manages runtime context, and coordinates handoffs and human checkpoints. AI models are a foundational capability agents can use; ARSY orchestrates the wider system and its work traces.",
      inputs: ["Mandate and mission scope", "Agent, tool, and source registry", "Runtime environment and policies"],
      outputs: ["Orchestration plan", "Task and handoff trace", "Evidence package for review"],
    },
    idLocale: {
      descriptor: "Agent Reality System Yard & Orchestration", context: "AGENCY",
      summary: "Lapisan agency yang merangkai agen, alat, sumber, lingkungan eksekusi, dan alur kerja. Model AI hanyalah salah satu kemampuan dasar di dalam sistem ini.",
      description: "Rancangan lapisan agency yang mengatur agen berdasarkan peran dan mandat, menghubungkan alat serta sumber, membagi tugas, mengelola konteks eksekusi, dan mengatur handoff serta checkpoint manusia. Model AI adalah kemampuan dasar yang dapat dipakai agen; ARSY mengorkestrasi keseluruhan sistem dan jejak kerjanya.",
      inputs: ["Mandat dan lingkup misi", "Registry agen, alat, dan sumber", "Lingkungan eksekusi dan kebijakan"],
      outputs: ["Rencana orkestrasi", "Jejak tugas dan handoff", "Paket bukti untuk tinjauan"],
    },
  },
  {
    id: "heliogrid", index: "02", code: "SYS 02", name: "HELIOGRID", accent: "amber", icon: "activity", status: "design",
    en: {
      descriptor: "Power & measurement", context: "ENERGY",
      summary: "An energy system model grounded in real meters, grid power, solar, storage, and safety limits.",
      description: "A proposed digital twin for monitoring grid, solar, batteries, and server power. Protonic fuel-cell studies are research, not free-energy generation.",
      inputs: ["Certified meters", "Grid / solar telemetry", "Battery status"],
      outputs: ["Energy budget", "Measured kWh", "Safety alerts"],
    },
    idLocale: {
      descriptor: "Daya & pengukuran", context: "ENERGI",
      summary: "Model sistem energi yang mengutamakan meter nyata, jaringan, surya, penyimpanan, dan batas keselamatan.",
      description: "Usulan kembaran digital untuk memantau jaringan, surya, baterai, dan daya server. Studi sel bahan bakar protonik adalah riset, bukan pembangkit energi gratis.",
      inputs: ["Meter tersertifikasi", "Telemetri jaringan / surya", "Status baterai"],
      outputs: ["Anggaran energi", "kWh terukur", "Peringatan keselamatan"],
    },
  },
  {
    id: "qrealm", index: "03", code: "SYS 03", name: "Q-REALM", accent: "violet", icon: "spark", status: "research",
    en: {
      descriptor: "Quantum & computing research", context: "COMPUTING",
      summary: "Circuit experiments and optional QPU comparisons against classical methods. The project does not claim to own quantum hardware.",
      description: "Repeatable quantum-circuit simulation and optional comparisons with external QPUs against classical methods. No invented quantum advantage; this project does not own or operate quantum hardware.",
      inputs: ["Problem definition", "Classical baseline", "Approved provider"],
      outputs: ["Circuit metrics", "Accuracy comparison", "Experiment evidence"],
    },
    idLocale: {
      descriptor: "Riset kuantum & komputasi", context: "KOMPUTASI",
      summary: "Eksperimen sirkuit dan pembandingan QPU opsional terhadap metode klasik. Proyek ini tidak mengklaim memiliki perangkat kuantum.",
      description: "Simulasi sirkuit kuantum yang dapat diulang dan pembandingan QPU eksternal opsional dengan metode klasik. Tidak menjanjikan keunggulan kuantum (no invented quantum advantage); proyek ini tidak memiliki atau mengoperasikan perangkat kuantum.",
      inputs: ["Definisi masalah", "Pembanding klasik", "Penyedia yang disetujui"],
      outputs: ["Metrik sirkuit", "Perbandingan akurasi", "Bukti eksperimen"],
    },
  },
  {
    id: "forge", index: "04", code: "SYS 04", name: "MATERIAL FORGE", accent: "rose", icon: "modules", status: "design",
    en: {
      descriptor: "Materials discovery", summary: "Licensed data flows, simulation, candidate screening, lab testing, and independent replication.",
      description: "Materials research pipeline: data licensing, DFT/simulation, candidate screening, professional laboratory testing, and independent replication.",
      inputs: ["Scientific datasets", "Material structures", "Lab safety plan"],
      outputs: ["Simulation results", "Candidate registry", "Reviewable experiments"],
    },
    idLocale: {
      descriptor: "Penemuan material", summary: "Alur data berlisensi, simulasi, penyaringan kandidat, pengujian laboratorium, dan replikasi independen.",
      description: "Alur riset material: lisensi data, DFT/simulasi, penyaringan kandidat, pengujian laboratorium profesional, dan replikasi independen.",
      inputs: ["Dataset ilmiah", "Struktur material", "Rencana keselamatan lab"],
      outputs: ["Hasil simulasi", "Registry kandidat", "Eksperimen yang dapat ditinjau"],
    },
  },
  {
    id: "knowledge", index: "05", code: "SYS 05", name: "UNIVERSAL COSMOS", accent: "blue", icon: "knowledge", status: "metadata",
    en: {
      descriptor: "Knowledge & comparison", summary: "UNILEX and four distinct source families: Qur’an, Torah, Psalms, and canonical Gospel narratives, without automatically equating Islamic references to the Gospel.",
      description: "UNILEX and Qur’an/Torah/Psalms/Gospel source families, plus planned Daoist and Shinto studies with distinct editions, provenance, and interpretations.",
      inputs: ["Edition metadata", "Licensed texts", "Expert review"],
      outputs: ["Contextual search", "Term comparison", "Source citations"],
    },
    idLocale: {
      descriptor: "Pengetahuan & perbandingan", summary: "UNILEX dan empat keluarga sumber yang tetap terpisah: Qur’an, Torah, Mazmur, dan narasi Injil kanonik; referen Injil dalam Islam tidak otomatis disamakan.",
      description: "UNILEX dan keluarga sumber Qur’an/Torah/Mazmur/Injil, serta kajian Daoist and Shinto (tradisi Dao dan Shinto) yang direncanakan dengan edisi, asal, dan interpretasi yang dibedakan.",
      inputs: ["Metadata edisi", "Teks berlisensi", "Tinjauan ahli"],
      outputs: ["Pencarian kontekstual", "Perbandingan istilah", "Sitasi sumber"],
    },
  },
  {
    id: "ziil", index: "06", code: "SYS 06", name: "ZIIL", accent: "gold", icon: "approval", status: "foundation",
    en: {
      descriptor: "Rights, review & safety", context: "GOVERNANCE", summary: "Keeps consent, privacy, risk assessment, appeal, audit, and action control with people.",
      description: "Human governance, consent, risk assessment, privacy, appeals, and bounded AI actions. Software does not confer religious or divine authority.",
      inputs: ["Operator mandate", "Risk evidence", "Policy boundaries"],
      outputs: ["Review status", "Safeguards", "Audit record"],
    },
    idLocale: {
      descriptor: "Hak, tinjauan & keselamatan", context: "TATA KELOLA", summary: "Menjaga persetujuan, privasi, penilaian risiko, banding, audit, dan kendali tindakan tetap pada manusia.",
      description: "Tata kelola manusia, persetujuan, penilaian risiko, privasi, banding, dan tindakan AI terbatas. Perangkat lunak tidak memberi otoritas agama atau ilahi.",
      inputs: ["Mandat operator", "Bukti risiko", "Batas kebijakan"],
      outputs: ["Status tinjauan", "Perlindungan", "Catatan audit"],
    },
  },
];

const statusLabels: Record<StatusKey, Record<PortalLanguage, string>> = {
  design: { id: "RANCANGAN", en: "DESIGN" },
  research: { id: "RISET", en: "RESEARCH" },
  metadata: { id: "METADATA", en: "METADATA" },
  foundation: { id: "FONDASI", en: "FOUNDATION" },
};

export function getPortalSystems(language: PortalLanguage) {
  return systems.map((system) => {
    const content = language === "en" ? system.en : system.idLocale;
    return {
      ...system,
      ...content,
      statusLabel: statusLabels[system.status][language],
      statusTone: system.status === "research" ? "warning" as const : system.status === "foundation" ? "success" as const : "info" as const,
      explorerName: content.context ? `${system.name} · ${content.context}` : system.name,
    };
  });
}
