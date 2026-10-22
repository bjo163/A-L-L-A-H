import Link from "next/link";
import { ActionPanel, ArrowLeftIcon, ArrowUpIcon, buttonClassName, Container, IconText, ReadinessBoard, RoadmapTimeline, SectionHeading, ExternalLinkIcon } from "@empire/ui";
import type { ReadinessBoardItem, RoadmapTimelineItem } from "@empire/ui";
import { getPortalLanguage } from "../../lib/i18n";
import { PortalPageCrosslinks, PortalPageIntro } from "../../components/PortalPageChrome";

const indonesianPhases = [
  { id: "foundation", number: "00", title: "Fondasi arsitektur & registry", status: "FONDASI", description: "Usulan V5, manifest internal, metadata ontologi, dan CI; bukan bukti perangkat ilmiah tersedia." },
  { id: "operations", number: "01", title: "Bukti operasi 100CENTER", status: "BERJALAN", description: "Sesi kata sandi lokal dan RBAC, migrasi PostgreSQL terlacak, ResearchRun → Workflow → Job → Evidence → Approval dengan lingkup tenant, CAB, dan audit. OIDC produksi dan bukti pemulihan masih diperlukan." },
  { id: "energy", number: "02", title: "Pilot energi HELIOGRID", status: "DIRENCANAKAN", description: "Meter terkalibrasi baca-saja, pengukuran watt/kWh, dan simulasi energi aman sebelum kendali fisik." },
  { id: "materials", number: "03", title: "Simulasi Material Forge", status: "DIRENCANAKAN", description: "Simulasi material klasik yang dapat diulang beserta asal data; kemitraan laboratorium diperlukan untuk sampel." },
  { id: "computing", number: "04", title: "Pembandingan kuantum / proton / foton", status: "RISET", description: "Riset opsional QPU, optik, dan protonik dengan pembanding klasik, daya seluruh sistem, dan presisi terukur." },
  { id: "cosmos", number: "05", title: "Korpus Cosmos komparatif", status: "DIRENCANAKAN", description: "Sumber Dao, Shinto, dan lainnya yang berlisensi, konteks ahli, dan pembedaan tegas antara istilah sains dan agama." },
  { id: "safety", number: "06", title: "Operasi ekosistem aman", status: "MASA DEPAN", description: "Tinjauan keselamatan independen, backup/pemulihan, uji otorisasi, deployment terpantau, dan rollback terdokumentasi." },
] as const;

const englishPhases = [
  { title: "Architecture & registry foundation", status: "FOUNDATION", description: "V5 proposal, internal manifests, ontology metadata, and CI; not evidence that scientific equipment exists." },
  { title: "100CENTER operational evidence", status: "IN PROGRESS", description: "Local password sessions and RBAC, tracked PostgreSQL migrations, ResearchRun → Workflow → Job → Evidence → Approval with tenant scope, CAB, and audit. Production OIDC and recovery evidence are still required." },
  { title: "HELIOGRID energy pilot", status: "PLANNED", description: "Calibrated read-only meters, watt/kWh measurement, and safe energy simulation before physical control." },
  { title: "Material Forge simulation", status: "PLANNED", description: "Repeatable classical material simulation with data provenance; lab partnership is required for samples." },
  { title: "Quantum / proton / photon comparison", status: "RESEARCH", description: "Optional QPU, optical, and protonic research with classical baselines, whole-system power, and measured precision." },
  { title: "Comparative Cosmos corpus", status: "PLANNED", description: "Licensed Dao, Shinto, and other sources, expert context, and a clear distinction between scientific and religious terms." },
  { title: "Safe ecosystem operations", status: "FUTURE", description: "Independent safety review, backup/recovery, authorization tests, monitored deployment, and documented rollback." },
] as const;

const indonesianReadiness = [
  ["Monorepo framework", "KODE TERSEDIA"],
  ["Tujuh manifest modul", "TERVALIDASI"],
  ["Kosakata universal", "REGISTRY TERSEDIA"],
  ["PostgreSQL lokal", "MIGRASI SEBELUM API DIMULAI"],
  ["Identitas operator 100CENTER", "BELUM TERSERTIFIKASI"],
  ["Sistem surya / protonik fisik", "BELUM TERPASANG"],
  ["Perangkat kuantum milik proyek", "BELUM TERPASANG"],
  ["Material baru disintesis", "TIDAK DIKLAIM"],
] as const;

const englishReadiness = [
  ["Monorepo framework", "CODE AVAILABLE"],
  ["Seven module manifests", "VALIDATED"],
  ["Universal vocabulary", "REGISTRY AVAILABLE"],
  ["Local PostgreSQL", "MIGRATION BEFORE API START"],
  ["100CENTER operator identity", "NOT CERTIFIED"],
  ["Physical solar / protonic system", "NOT INSTALLED"],
  ["Project-owned quantum device", "NOT INSTALLED"],
  ["New material synthesized", "NOT CLAIMED"],
] as const;

const reviewDate = "2026-10-22";

export default async function RoadmapPage() {
  const en = (await getPortalLanguage()) === "en";
  const phases = en ? englishPhases : indonesianPhases;
  const timelineItems: readonly RoadmapTimelineItem[] = phases.map((phase, index) => ({
    id: `phase-${index}`,
    number: String(index).padStart(2, "0"),
    status: phase.status,
    title: phase.title,
    description: phase.description,
    current: index === 0,
  }));
  const readinessSource = en ? englishReadiness : indonesianReadiness;
  const readinessItems: readonly ReadinessBoardItem[] = readinessSource.map(([label, status], index) => ({
    id: `readiness-${index}`,
    label,
    status,
  }));

  return <Container className="inner-page">
    <PortalPageIntro
      homeLabel={en ? "HOME" : "BERANDA"}
      section={en ? "ROADMAP" : "PETA JALAN"}
      chapter={en ? "READINESS" : "KESIAPAN"}
      eyebrow={en ? "BUILD WHAT CAN BE VERIFIED" : "BANGUN YANG DAPAT DIVERIFIKASI"}
      title={<>{en ? "DARE TO IMAGINE." : "BERANI MEMBAYANGKAN."}<br/><em>{en ? "STAY TRUE TO EVIDENCE." : "JUJUR PADA BUKTI."}</em></>}
      description={en ? "This roadmap distinguishes code, scientific literature, physical equipment, and operational certification. A concept is not a deployment; a successful build does not prove a real-world experiment." : "Peta jalan membedakan kode, literatur ilmiah, perangkat fisik, dan sertifikasi operasi. Konsep bukan deployment; build yang berhasil juga belum membuktikan eksperimen dunia nyata."}
      sfx={en ? "CHECK!" : "CEK!"}
      links={[
        { href: "/systems", label: en ? "Architecture atlas" : "Peta arsitektur", icon: <ArrowLeftIcon />, iconPosition: "start" },
        { href: "/#ekosistem", label: en ? "Technology domains" : "Domain teknologi" },
        { href: "https://github.com/bjo163/empire-of-the-light", label: en ? "Repository" : "Repositori", external: true, icon: <ExternalLinkIcon /> },
      ]}
    />
    <section className="roadmap-page-grid">
      <div>
        <SectionHeading
          className="roadmap-section-heading"
          eyebrowClassName="eyebrow"
          eyebrow={en ? "IMPLEMENTATION HORIZON" : "HORIZON IMPLEMENTASI"}
          title={en ? <>FROM BLUEPRINT<br/>TO REALITY.</> : <>DARI BLUEPRINT<br/>MENUJU KENYATAAN.</>}
        />
        <RoadmapTimeline label={en ? "Implementation phases" : "Tahapan implementasi"} items={timelineItems}/>
      </div>
      <ReadinessBoard
        label={en ? "REPOSITORY STATUS" : "STATUS REPOSITORI"}
        title={en ? "WHAT EXISTS TODAY?" : "APA YANG SUDAH ADA?"}
        reviewedLabel={en ? "Snapshot reviewed" : "Snapshot ditinjau"}
        reviewedAt={reviewDate}
        reviewedDate={en ? "22 October 2026" : "22 Oktober 2026"}
        items={readinessItems}
        note={en ? "These labels describe the baseline recorded on the review date, not a live operations monitor." : "Label ini menjelaskan baseline yang tercatat pada tanggal peninjauan, bukan monitor operasi yang diperbarui otomatis."}
      />
    </section>
    <ActionPanel
      eyebrow={en ? "OPEN WORK" : "KERJA TERBUKA"}
      title={en ? "CHANGES CAN BE TRACED." : "PERUBAHAN DAPAT DITELUSURI."}
      description={en ? "Review engineering and research proposals, then follow changes on GitHub. Deployments and scientific results each require their own evidence." : "Tinjau proposal rekayasa dan riset, lalu ikuti perubahannya melalui GitHub. Deployment dan hasil ilmiah membutuhkan bukti masing-masing."}
      action={<a className={buttonClassName("primary", "eol-button--lg")} href="https://github.com/bjo163/empire-of-the-light" target="_blank" rel="noopener noreferrer"><IconText icon={<ExternalLinkIcon />}>{en ? "Explore GitHub" : "Jelajahi GitHub"}</IconText></a>}
    />
    <PortalPageCrosslinks label={en ? "Related pages" : "Halaman terkait"} links={[
      { href: "/systems", label: en ? "Back to system atlas" : "Kembali ke atlas sistem", icon: <ArrowLeftIcon />, iconPosition: "start" },
      { href: "/#peta-jalan", label: en ? "Back to roadmap overview" : "Kembali ke ringkasan peta jalan", icon: <ArrowUpIcon /> },
    ]}/>
  </Container>;
}
