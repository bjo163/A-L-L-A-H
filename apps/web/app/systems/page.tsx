import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, buttonClassName, ChevronDownIcon, Container, IconText, ModuleGridItem, RepositoryOverview, SystemAtlas, ArrowUpRightIcon, ExternalLinkIcon } from "@empire/ui";
import { getWebLanguage } from "../../lib/i18n";
import { PageCrosslinks, PageIntro } from "../../components/PageChrome";

const systemsId = ["100center", "arsy", "qrealm", "heliogrid", "forge", "knowledge"] as const;
const moduleNames = ["Kernel", "Research", "Scripture", "Journey", "Mission", "Governance", "ZIIL"] as const;

const indonesian = [
  { category: "Ruang kendali yang dipimpin manusia", title: "MANUSIA & OPERASI", system: "100CENTER", description: "Akses operator, persetujuan, lingkup misi, perjalanan DIRI/KOMUNITAS/GLOBAL, dan tanggung jawab. Otoritas nyata memerlukan autentikasi dan mandat yang ditinjau." },
  { category: "Agent Reality System Yard & Orchestration", title: "ARSY · AGENCY & ORKESTRASI", system: "ARSY", description: "Rancangan sistem untuk menyusun agen berdasarkan peran dan mandat, menghubungkan tools serta sumber, mengatur pembagian tugas dan runtime, menangani handoff serta persetujuan manusia, dan menelusuri hasil. Model AI adalah salah satu kemampuan dasar, bukan keseluruhan ARSY." },
  { category: "Paradigma berbeda, satu orkestrasi", title: "KOMPUTASI", system: "Q-REALM", description: "Pembanding CPU/GPU klasik lebih dahulu; riset HPC/QPU, fotonik, dan protonik hanya jika ada alasan yang dapat diuji." },
  { category: "Ukur sebelum mengendalikan", title: "ENERGI & DUNIA FISIK", system: "HELIOGRID", description: "Listrik jaringan, surya, baterai, UPS, telemetri, batas termal, dan riset elektrokimia hidrogen tersertifikasi." },
  { category: "Dari fisika ke bukti berulang", title: "PENELITIAN & MATERIAL", system: "MATERIAL FORGE", description: "Data berlisensi, penyaringan komputasional, persiapan sampel, pengukuran, replikasi, dan tinjauan ahli. Kandidat bukan penemuan." },
  { category: "Banyak sumber, konteks terjaga", title: "PENGETAHUAN & KOSMOS", system: "UNILEX / SIDRA", description: "Empat keluarga sumber kitab suci awal dan kajian Tao, Shinto, serta komparatif yang tetap terpisah dari fisika empiris." },
  { category: "Batas adalah bagian dari kecerdasan", title: "PERLINDUNGAN & TATA KELOLA", system: "ZIIL / MUNTAHA", description: "Privasi, keamanan, persetujuan manusia, ketidakpastian, penilaian risiko, audit, respons insiden, dan pemulihan." },
] as const;

const english = [
  { category: "HUMANS & OPERATIONS", title: "HUMANS & OPERATIONS", system: "100CENTER", description: "Human-led control room · Operator access, approvals, mission scope, journeys, and accountability. Real authority requires reviewed identity and mandate." },
  { category: "ARSY · AGENCY & ORCHESTRATION", title: "ARSY · AGENCY & ORCHESTRATION", system: "ARSY", description: "Agent Reality System Yard & Orchestration · A proposed system for arranging agents by role and mandate, connecting tools and sources, assigning work and runtimes, handling handoffs and human approvals, and tracing outcomes. AI models are one foundational capability, not all of ARSY." },
  { category: "COMPUTING", title: "COMPUTING", system: "Q-REALM", description: "Different paradigms, one orchestration · Classical CPU/GPU baselines first; HPC/QPU, photonics, and protonics research only when testable reasons exist." },
  { category: "ENERGY & PHYSICAL WORLD", title: "ENERGY & PHYSICAL WORLD", system: "HELIOGRID", description: "Measure before control · Grid power, solar, batteries, UPS, telemetry, thermal limits, and certified hydrogen electrochemistry research." },
  { category: "RESEARCH & MATERIALS", title: "RESEARCH & MATERIALS", system: "MATERIAL FORGE", description: "From physics to repeatable evidence · Licensed data, computational screening, sample preparation, measurement, replication, and expert review. A candidate is not a discovery." },
  { category: "KNOWLEDGE & COSMOS", title: "KNOWLEDGE & COSMOS", system: "UNILEX / SIDRA", description: "Many sources, context preserved · Four early scripture source families and Dao, Shinto, and comparative study kept distinct from empirical physics." },
  { category: "PROTECTION & GOVERNANCE", title: "PROTECTION & GOVERNANCE", system: "ZIIL / MUNTAHA", description: "Boundaries are part of intelligence · Privacy, security, human approval, uncertainty, risk review, audit, incident response, and recovery." },
] as const;

export default async function SystemsPage() {
  const en = (await getWebLanguage()) === "en";
  const planeContent = en ? english : indonesian;
  const modules: readonly ModuleGridItem[] = moduleNames.map((name, index) => ({
    id: name.toLowerCase(),
    number: String(index + 1).padStart(2, "0"),
    name,
    status: index === 0 ? (en ? "FRAMEWORK" : "KERANGKA") : "SCAFFOLD",
  }));

  return <Container className="inner-page">
    <PageIntro
      homeLabel={en ? "HOME" : "BERANDA"}
      section={en ? "SYSTEM ATLAS" : "ATLAS SISTEM"}
      chapter="GENESIS 05"
      eyebrow={en ? "A-L-L-A-H ARCHITECTURE" : "ARSITEKTUR A-L-L-A-H"}
      title={<>{en ? "EVERY LAYER." : "TIAP LAPISAN."}<br/><em>{en ? "ONE PURPOSE." : "SATU TUJUAN."}</em></>}
      description={en ? "Seven layers connect human needs, scientific work, energy infrastructure, and evidence-based decisions. This is a proposed architecture, not a list of installed equipment." : "Tujuh lapisan menghubungkan kebutuhan manusia, pekerjaan ilmiah, infrastruktur energi, dan keputusan berbasis bukti. Ini adalah arsitektur usulan, bukan daftar perangkat yang sudah terpasang."}
      sfx={en ? "POW!" : "DOR!"}
      links={[
        { href: "/#ekosistem", label: en ? "Technology domains" : "Domain teknologi", icon: <ChevronDownIcon /> },
        { href: "/#penjelajah", label: en ? "System explorer" : "Penjelajah sistem", icon: <ChevronDownIcon /> },
        { href: "/roadmap", label: en ? "Implementation status" : "Status implementasi", icon: <ArrowUpRightIcon /> },
      ]}
    />
    <SystemAtlas items={planeContent.map((item, index) => ({
      id: `plane-${index + 1}`,
      number: String(index + 1).padStart(2, "0"),
      category: item.category,
      title: item.title,
      titleId: index < systemsId.length ? systemsId[index] : undefined,
      description: item.description,
      system: item.system,
    }))}/>
    <RepositoryOverview
      eyebrow={en ? "IMPLEMENTATION IN REPOSITORY" : "IMPLEMENTASI DI REPOSITORI"}
      title={en ? <>ONE <em>MODULAR MONOREPO.</em></> : <>SATU <em>MONOREPO MODULAR.</em></>}
      description={en ? "One Next.js web app serves the public system atlas and the authenticated 100CENTER operator workspace. The API uses Fastify and storage uses PostgreSQL. New research modules remain proposals until contracts and ownership are approved." : "Satu web app Next.js menyajikan atlas publik dan ruang kerja operator 100CENTER yang memerlukan autentikasi. API memakai Fastify dan penyimpanan memakai PostgreSQL. Modul riset baru tetap berstatus usulan sampai kontrak dan kepemilikannya disetujui."}
      actions={<Link className={buttonClassName("primary", "eol-button--lg")} href="/roadmap"><IconText icon={<ArrowUpRightIcon />}>{en ? "Review readiness" : "Tinjau kesiapan"}</IconText></Link>}
      modules={modules}
      modulesLabel={en ? "Repository modules" : "Modul repositori"}
    />
    <PageCrosslinks label={en ? "Related pages" : "Halaman terkait"} links={[
      { href: "/#ekosistem", label: en ? "Back to technology domains" : "Kembali ke domain teknologi", icon: <ArrowLeftIcon />, iconPosition: "start" },
      { href: "/roadmap", label: en ? "Continue to roadmap & readiness" : "Lanjut ke peta jalan & kesiapan", icon: <ArrowRightIcon /> },
    ]}/>
    <p className="source-line">{en ? "Read the architecture blueprint: " : "Baca blueprint arsitektur: "}<a href="https://github.com/bjo163/empire-of-the-light/blob/main/docs/BLUEPRINT_V5_QUANTUM_PROTON_BEYOND_AI.md" target="_blank" rel="noopener noreferrer"><IconText icon={<ExternalLinkIcon />}>GENESIS v5 Master Blueprint</IconText></a></p>
  </Container>;
}
