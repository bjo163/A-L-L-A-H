import Link from "next/link";
import { Badge, buttonClassName, Icon, IconText, IdentityCardGroup, MangaEffect, MetricGrid, Panel, PortalOrbitHero, SectionHeading } from "@empire/ui";
import { Explorer } from "../components/Explorer";
import { getPortalLanguage } from "../lib/i18n";

const markers = [
  { number: "07", label: "Lapisan arsitektur" },
  { number: "06", label: "Domain teknologi" },
  { number: "04", label: "Keluarga sumber awal" },
  { number: "01", label: "Otoritas keputusan: manusia" },
];

const layers = [
  { code: "P01", label: "MANUSIA & MISI", detail: "Orang, komunitas, perjalanan, mandat, dan keputusan yang bertanggung jawab" },
  { code: "P02", label: "ARSY · AGENCY & ORKESTRASI", detail: "Agen, alat, alur kerja, konteks eksekusi, kebijakan, dan checkpoint manusia" },
  { code: "P03", label: "KOMPUTASI", detail: "CPU/GPU sebagai dasar; riset QPU, fotonik, dan protonik sebagai opsi" },
  { code: "P04", label: "ENERGI HELIOGRID", detail: "Jaringan, surya, baterai, pengukuran, dan model keselamatan" },
  { code: "P05", label: "MATERIAL FORGE", detail: "Simulasi, kandidat material, eksperimen yang dapat direplikasi" },
  { code: "P06", label: "PENGETAHUAN & SUMBER", detail: "UNILEX, teks dengan edisi jelas, tradisi, dan sains empiris" },
  { code: "P07", label: "TATA KELOLA ZIIL", detail: "Persetujuan, privasi, bukti, audit, batas tindakan, dan pemulihan" },
];

const systems = [
  { index: "01", id: "arsy", name: "ARSY", descriptor: "Agent Reality System Yard & Orchestration", tag: "RANCANGAN", color: "mint", summary: "Lapisan agency yang merangkai agen, alat, sumber, lingkungan eksekusi, dan alur kerja. Model AI hanyalah salah satu kemampuan dasar di dalam sistem ini." },
  { index: "02", id: "heliogrid", name: "HELIOGRID", descriptor: "Energi & pengukuran", tag: "RANCANGAN", color: "amber", summary: "Model sistem energi yang mengutamakan meter nyata, jaringan, surya, penyimpanan, dan batas keselamatan." },
  { index: "03", id: "qrealm", name: "Q-REALM", descriptor: "Riset komputasi", tag: "RISET", color: "violet", summary: "Eksperimen sirkuit dan pembandingan QPU opsional terhadap metode klasik. Proyek ini tidak mengklaim memiliki perangkat kuantum." },
  { index: "04", id: "forge", name: "MATERIAL FORGE", descriptor: "Penemuan material", tag: "RANCANGAN", color: "rose", summary: "Alur data berlisensi, simulasi, penyaringan kandidat, pengujian laboratorium, dan replikasi independen." },
  { index: "05", id: "knowledge", name: "UNIVERSAL COSMOS", descriptor: "Pengetahuan & makna", tag: "METADATA", color: "blue", summary: "UNILEX dan empat keluarga sumber yang tetap terpisah: Qur’an, Torah, Mazmur, dan narasi Injil kanonik; referen Injil dalam Islam tidak otomatis disamakan." },
  { index: "06", id: "ziil", name: "ZIIL", descriptor: "Hak, tinjauan & keselamatan", tag: "FONDASI", color: "gold", summary: "Menjaga persetujuan, privasi, penilaian risiko, banding, audit, dan kendali tindakan tetap pada manusia." },
];

const flow = [
  { n: "01", title: "Sumber", text: "Teks, data, dan pengukuran menyimpan asal serta konteksnya." },
  { n: "02", title: "ARSY", text: "Agen, alat, dan alur kerja dikoordinasikan sesuai mandat; model AI menjadi salah satu kemampuan dasarnya." },
  { n: "03", title: "100CENTER", text: "Orang yang berwenang meninjau bukti, kesiapan, dan mandat." },
  { n: "04", title: "Aksi", text: "Keputusan dijalankan manusia, dicatat, dan dapat ditinjau kembali." },
];

export default async function Home() {
  const language = await getPortalLanguage();
  const en = language === "en";
  const markers = en
    ? [{number:"07",label:"Architecture layers"},{number:"06",label:"Technology domains"},{number:"04",label:"Early source families"},{number:"01",label:"Decision authority: humans"}]
    : [{number:"07",label:"Lapisan arsitektur"},{number:"06",label:"Domain teknologi"},{number:"04",label:"Keluarga sumber awal"},{number:"01",label:"Otoritas keputusan: manusia"}];
  const layers = en ? [
    {code:"P01",label:"HUMANS & MISSION",detail:"People, communities, journeys, mandates, and accountable decisions"},
    {code:"P02",label:"ARSY · AGENCY & ORCHESTRATION",detail:"Agents, tools, workflows, runtime context, policies, and human checkpoints"},
    {code:"P03",label:"COMPUTING",detail:"CPU/GPU as the baseline; QPU, photonics, and protonics as research options"},
    {code:"P04",label:"HELIOGRID ENERGY",detail:"Grid, solar, batteries, measurement, and safety models"},
    {code:"P05",label:"MATERIAL FORGE",detail:"Simulation, material candidates, and reproducible experiments"},
    {code:"P06",label:"KNOWLEDGE & SOURCES",detail:"UNILEX, clearly-editioned texts, traditions, and empirical science"},
    {code:"P07",label:"ZIIL GOVERNANCE",detail:"Consent, privacy, evidence, audit, action limits, and recovery"},
  ] : [
    { code: "P01", label: "MANUSIA & MISI", detail: "Orang, komunitas, perjalanan, mandat, dan keputusan yang bertanggung jawab" },
    { code: "P02", label: "ARSY · AGENCY & ORKESTRASI", detail: "Agen, alat, alur kerja, konteks eksekusi, kebijakan, dan checkpoint manusia" },
    { code: "P03", label: "KOMPUTASI", detail: "CPU/GPU sebagai dasar; riset QPU, fotonik, dan protonik sebagai opsi" },
    { code: "P04", label: "ENERGI HELIOGRID", detail: "Jaringan, surya, baterai, pengukuran, dan model keselamatan" },
    { code: "P05", label: "MATERIAL FORGE", detail: "Simulasi, kandidat material, eksperimen yang dapat direplikasi" },
    { code: "P06", label: "PENGETAHUAN & SUMBER", detail: "UNILEX, teks dengan edisi jelas, tradisi, dan sains empiris" },
    { code: "P07", label: "TATA KELOLA ZIIL", detail: "Persetujuan, privasi, bukti, audit, batas tindakan, dan pemulihan" },
  ];
  const systems = en ? [
    {index:"01",id:"arsy",name:"ARSY",descriptor:"Agent Reality System Yard & Orchestration",tag:"DESIGN",color:"mint",summary:"An agency layer that composes agents, tools, sources, runtime environments, and workflows. AI models are one foundational capability in the system."},
    {index:"02",id:"heliogrid",name:"HELIOGRID",descriptor:"Energy & measurement",tag:"DESIGN",color:"amber",summary:"An energy system model grounded in real meters, grid power, solar, storage, and safety limits."},
    {index:"03",id:"qrealm",name:"Q-REALM",descriptor:"Computing research",tag:"RESEARCH",color:"violet",summary:"Circuit experiments and optional QPU comparisons against classical methods. The project does not claim to own quantum hardware."},
    {index:"04",id:"forge",name:"MATERIAL FORGE",descriptor:"Materials discovery",tag:"DESIGN",color:"rose",summary:"Licensed data flows, simulation, candidate screening, lab testing, and independent replication."},
    {index:"05",id:"knowledge",name:"UNIVERSAL COSMOS",descriptor:"Knowledge & meaning",tag:"METADATA",color:"blue",summary:"UNILEX and four distinct source families: Qur’an, Torah, Psalms, and canonical Gospel narratives, without automatically equating Islamic references to the Gospel."},
    {index:"06",id:"ziil",name:"ZIIL",descriptor:"Rights, review & safety",tag:"FOUNDATION",color:"gold",summary:"Keeps consent, privacy, risk assessment, appeal, audit, and action control with people."},
  ] : [
    { index: "01", id: "arsy", name: "ARSY", descriptor: "Agent Reality System Yard & Orchestration", tag: "RANCANGAN", color: "mint", summary: "Lapisan agency yang merangkai agen, alat, sumber, lingkungan eksekusi, dan alur kerja. Model AI hanyalah salah satu kemampuan dasar di dalam sistem ini." },
    { index: "02", id: "heliogrid", name: "HELIOGRID", descriptor: "Energi & pengukuran", tag: "RANCANGAN", color: "amber", summary: "Model sistem energi yang mengutamakan meter nyata, jaringan, surya, penyimpanan, dan batas keselamatan." },
    { index: "03", id: "qrealm", name: "Q-REALM", descriptor: "Riset komputasi", tag: "RISET", color: "violet", summary: "Eksperimen sirkuit dan pembandingan QPU opsional terhadap metode klasik. Proyek ini tidak mengklaim memiliki perangkat kuantum." },
    { index: "04", id: "forge", name: "MATERIAL FORGE", descriptor: "Penemuan material", tag: "RANCANGAN", color: "rose", summary: "Alur data berlisensi, simulasi, penyaringan kandidat, pengujian laboratorium, dan replikasi independen." },
    { index: "05", id: "knowledge", name: "UNIVERSAL COSMOS", descriptor: "Pengetahuan & makna", tag: "METADATA", color: "blue", summary: "UNILEX dan empat keluarga sumber yang tetap terpisah: Qur’an, Torah, Mazmur, dan narasi Injil kanonik; referen Injil dalam Islam tidak otomatis disamakan." },
    { index: "06", id: "ziil", name: "ZIIL", descriptor: "Hak, tinjauan & keselamatan", tag: "FONDASI", color: "gold", summary: "Menjaga persetujuan, privasi, penilaian risiko, banding, audit, dan kendali tindakan tetap pada manusia." },
  ];
  const flow = en ? [
    {n:"01",title:"Sources",text:"Texts, data, and measurements retain provenance and context."},
    {n:"02",title:"ARSY",text:"Agents, tools, and workflows are coordinated within mandate; AI models are one foundational capability."},
    {n:"03",title:"100CENTER",text:"Authorized people review evidence, readiness, and mandate."},
    {n:"04",title:"Action",text:"People execute decisions, record them, and make them reviewable."},
  ] : [
    { n: "01", title: "Sumber", text: "Teks, data, dan pengukuran menyimpan asal serta konteksnya." },
    { n: "02", title: "ARSY", text: "Agen, alat, dan alur kerja dikoordinasikan sesuai mandat; model AI menjadi salah satu kemampuan dasarnya." },
    { n: "03", title: "100CENTER", text: "Orang yang berwenang meninjau bukti, kesiapan, dan mandat." },
    { n: "04", title: "Aksi", text: "Keputusan dijalankan manusia, dicatat, dan dapat ditinjau kembali." },
  ];
  return <>
    <PortalOrbitHero
      ariaLabel={en ? "Introducing A-L-L-A-H" : "Pengenalan A-L-L-A-H"}
      visualLabel={en ? "A-L-L-A-H system map: sources and evidence connect to ARSY, 100CENTER reviews, and ZIIL protects rights and safety" : "Peta hubungan A-L-L-A-H: sumber dan bukti terhubung ke ARSY, 100CENTER meninjau, dan ZIIL menjaga hak serta keselamatan"}
      eyebrow={<>EMPIRE OF THE LIGHT <span className="slash">/</span> GENESIS 05</>}
      title={en ? <>LIVE.<br/><span className="outline-word">LEARN.</span><br/><em>ACT.</em></> : <>HIDUP.<br/><span className="outline-word">BELAJAR.</span><br/><em>BERTINDAK.</em></>}
      description={<><strong>A-L-L-A-H — Accountable Life, Learning &amp; Action Hub</strong> — {en ? "is a proposed hub connecting people, knowledge, and technology through processes that can be examined." : "adalah rancangan hub untuk menghubungkan manusia, pengetahuan, dan teknologi melalui proses yang dapat diperiksa."}</>}
      actions={<><Link className={buttonClassName("primary", "btn")} href="#ekosistem"><IconText icon="arrowDownRight">{en ? "Explore the ecosystem" : "Jelajahi ekosistem"}</IconText></Link><Link className={buttonClassName("secondary", "btn")} href="/roadmap"><IconText icon="arrowRight">{en ? "See real status" : "Lihat status nyata"}</IconText></Link></>}
      clarity={<>{en ? "DESIGN & RESEARCH" : "RANCANGAN & RISET"} <span className="dot-sep">·</span> {en ? "NO CLAIM THAT HARDWARE IS INSTALLED" : "BUKAN KLAIM PERANGKAT SUDAH TERPASANG"}</>}
      centerLabel={en ? "HUMAN" : "HUB MANUSIA"}
      centerCaption={en ? "LEARNING · ACTION HUB" : "BELAJAR · AKSI"}
      satellites={[
        { id: "sources", label: en ? "SOURCES" : "SUMBER", caption: <>UNILEX · {en ? "EVIDENCE" : "BUKTI"}</> },
        { id: "arsy", label: "ARSY", caption: <>AGENCY · {en ? "ORCHESTRATION" : "ORKESTRASI"}</> },
        { id: "operators", label: "100CENTER", caption: en ? "HUMAN REVIEW" : "REVIEW MANUSIA" },
        { id: "ziil", label: "ZIIL", caption: en ? "RIGHTS · SAFETY" : "HAK · KESELAMATAN" },
      ]}
      coordinates={<>{en ? "SOURCES → ANALYSIS → REVIEW → DECISION" : "SUMBER → ANALISIS → TINJAUAN → KEPUTUSAN"}<br/>{en ? "MANDATE & EVIDENCE SET SYSTEM BOUNDARIES" : "MANDAT & BUKTI MENJAGA BATAS SISTEM"}</>}
      stamp={en ? "HUMAN POWER" : "KUASA MANUSIA"}
      soundEffect={en ? "ZAP!" : "JRENG!"}
      watermark={<>A<span>05</span></>}
    />

    <section className="stat-band" aria-label={en ? "Blueprint summary" : "Ringkasan blueprint"}><div className="eol-container"><MetricGrid profile="editorial" items={markers.map((m) => ({ value: m.number, label: m.label }))} /></div></section>

    <section className="section eol-container" id="identitas">
      <div className="section-intro"><p className="eyebrow">01 / {en?"WHAT IS A-L-L-A-H?":"APA ITU A-L-L-A-H?"}</p><h2>{en?<>A HUB FOR <em>LIFE, LEARNING, AND ACTION.</em></>:<>HUB UNTUK <em>HIDUP, BELAJAR, DAN BERTINDAK.</em></>}</h2><p>{en?"A-L-L-A-H is a project acronym, not a claim of divine authority. The system is designed to help people work with clear sources, inspectable evidence, and decisions made by those with authority.":"Nama A-L-L-A-H adalah akronim proyek, bukan klaim otoritas ilahi. Sistem ini dirancang agar teknologi membantu manusia bekerja dengan sumber yang jelas, bukti yang bisa diperiksa, dan keputusan yang tetap berada pada orang yang berwenang."}</p></div>
      <IdentityCardGroup items={[
        { id: "hub", featured: true, label: en ? "THE HUB" : "HUB UTAMA", title: "A-L-L-A-H", lead: <b>Accountable Life, Learning &amp; Action Hub</b>, description: en ? "A proposed platform for accountable knowledge, journeys, missions, learning, and action." : "Rancangan platform untuk pengetahuan, perjalanan, misi, pembelajaran, dan aksi yang dapat dipertanggungjawabkan." },
        { id: "arsy", className: "arsy-identity", label: en ? "AGENCY & ORCHESTRATION LAYER" : "LAPISAN AGENCY & ORKESTRASI", title: "ARSY", descriptor: "Agent Reality System Yard & Orchestration", description: en ? "Coordinates agents, tools, context, and task handoffs within human mandates. AI models are a basic component; ARSY orchestrates the wider system." : "Mengatur agen, alat, konteks, dan perpindahan tugas dalam batas mandat manusia. Model AI adalah komponen dasar; ARSY mengorkestrasi keseluruhan sistem.", actions: <Link href="/systems#arsy"><IconText icon="arrowUpRight">{en ? "Explore ARSY design" : "Lihat rancangan ARSY"}</IconText></Link> },
        { id: "operators", label: en ? "OPERATOR WORKSPACE" : "RUANG KERJA OPERATOR", title: "100CENTER", description: en ? "Operations interface for reviewing missions, research, readiness, approvals, and audit trails according to access." : "Antarmuka operasi untuk meninjau misi, riset, kesiapan, persetujuan, dan jejak audit sesuai akses." },
      ]} />
      <MangaEffect as="aside" panel className="principle-strip"><span>{en?"CORE PRINCIPLE":"PRINSIP INTI"}</span><p>{en?"AI assists · sources provide context · evidence supports · people decide":"AI membantu · sumber memberi konteks · bukti mendukung · manusia memutuskan"}</p><Link href="/systems#tata-kelola"><IconText icon="arrowUpRight">{en?"Explore boundaries & governance":"Lihat batas dan tata kelola"}</IconText></Link></MangaEffect>
    </section>

    <section className="section section-alt" id="ekosistem"><div className="eol-container">
      <SectionHeading layout="section" eyebrowClassName="eyebrow" eyebrow={<>02 / {en?"TECHNOLOGY IN ONE ECOSYSTEM":"TEKNOLOGI DALAM SATU EKOSISTEM"}</>} title={en?<>EVERY SYSTEM HAS A <em>ROLE.</em></>:<>SETIAP SISTEM PUNYA <em>PERAN.</em></>} aside={<Link className="text-link" href="/systems"><IconText icon="arrowUpRight">{en?"Open the full system atlas":"Buka atlas sistem lengkap"}</IconText></Link>} />
      <div className="frontier-grid">{systems.map((s) => <MangaEffect as="article" panel interactive className={`frontier-card theme-${s.color}`} id={s.id} key={s.id}>
        <div className="frontier-top"><span className="card-index">/ {s.index}</span><Badge className="stage-pill" tone={s.tag === "RISET" || s.tag === "RESEARCH" ? "warning" : s.tag === "FONDASI" || s.tag === "FOUNDATION" ? "success" : "info"}>{s.tag}</Badge></div>
        <div className="frontier-graphic" aria-hidden="true"><span className="shape-a"/><span className="shape-b"/><span className="shape-c"/></div>
        <div className="frontier-content"><p className="panel-label">{s.descriptor}</p><h3>{s.name}</h3><p>{s.summary}</p><Link href={`/systems#${s.id}`} className="card-link"><IconText icon="arrowUpRight">{en?`Explore ${s.name}`:`Pelajari peran ${s.name}`}</IconText></Link></div>
      </MangaEffect>)}</div>
    </div></section>

    <section className="section eol-container" id="arsitektur">
      <SectionHeading layout="section" eyebrowClassName="eyebrow" asideClassName="head-aside" eyebrow={<>03 / {en?"HOW THE COMPONENTS CONNECT":"BAGAIMANA KOMPONEN TERHUBUNG"}</>} title={en?<>FROM <em>SOURCES TO ACTION.</em></>:<>DARI <em>SUMBER KE AKSI.</em></>} aside={en?<>A traceable workflow.<br/>People review high-impact decisions.</>:<>Alur yang dapat ditelusuri.<br/>Keputusan berdampak tetap ditinjau manusia.</>} />
      <div className="flow-track" aria-label={en?"A-L-L-A-H workflow":"Alur kerja A-L-L-A-H"}>{flow.map((step, i) => <Panel as="article" manga className="flow-step" key={step.n}><span className="flow-number">{step.n}</span><h3>{step.title}</h3><p>{step.text}</p>{i < flow.length - 1 && <Icon name="arrowRight" className="flow-arrow" size={16}/>}</Panel>)}</div>
      <div className="plane-layout"><div className="plane-list">{layers.map((l, i) => <MangaEffect as={Link} row className="plane-row" href={`/systems#plane-${i + 1}`} key={l.code}><span>{l.code}</span><strong>{l.label}</strong><p>{l.detail}</p><Icon name="arrowUpRight" size={14}/></MangaEffect>)}</div><MangaEffect as="aside" panel className="plane-aside"><div className="stacks-orbit"><div className="stack-ring ring-large"/><div className="stack-ring ring-mid"/><div className="stack-ring ring-small"/><div className="stack-kernel">ARSY<small>{en?"ORCHESTRATION":"ORKESTRASI"}</small></div></div><p>{en?"Seven layers connect through sources, evidence, approval, and governance. Experimental technology remains research.":"Tujuh lapisan saling terhubung lewat sumber, bukti, persetujuan, dan tata kelola. Teknologi eksperimental tetap berstatus riset."}</p><Link href="/systems"><IconText icon="arrowUpRight">{en?"Explore the seven layers":"Jelajahi tujuh lapisan"}</IconText></Link></MangaEffect></div>
    </section>

    <section className="section section-alt" id="penjelajah"><div className="eol-container"><SectionHeading layout="section" eyebrowClassName="eyebrow" asideClassName="head-aside" eyebrow={<>04 / {en?"SYSTEM EXPLORER":"PENJELAJAH SISTEM"}</>} title={en?<>VIEW <em>INPUTS & OUTPUTS.</em></>:<>LIHAT <em>MASUKAN &amp; HASIL.</em></>} aside={en?<>Choose a domain to see its purpose,<br/>required data, and boundaries.</>:<>Pilih domain untuk melihat tujuan,<br/>data yang diperlukan, dan batasnya.</>} /><Explorer language={language}/><p className="explorer-footer-link"><Link href="/systems"><IconText icon="arrowUpRight">{en?"Open the complete architecture map":"Buka peta arsitektur lengkap"}</IconText></Link><span>{en?"Portal statuses refer to the blueprint, not live equipment monitoring.":"Semua status di portal ini merujuk pada blueprint, bukan pemantauan perangkat langsung."}</span></p></div></section>

    <section className="section eol-container" id="peta-jalan"><SectionHeading layout="section" eyebrowClassName="eyebrow" eyebrow={<>05 / {en?"BUILD SEQUENCE":"URUTAN MEMBANGUN"}</>} title={en?<>EVIDENCE FIRST. <em>CAPABILITY FOLLOWS.</em></>:<>BUKTI DULU. <em>KEMAMPUAN MENYUSUL.</em></>} aside={<Link className="text-link" href="/roadmap"><IconText icon="arrowUpRight">{en?"Roadmap & readiness":"Lihat peta jalan &amp; kesiapan"}</IconText></Link>} />
      <MangaEffect panel className="roadmap-teaser"><div><span className="checkpoint-number">01</span><span className="checkpoint-stage">{en?"CURRENT PRIORITY":"PRIORITAS SAAT INI"}</span><h3>{en?"BUILD VERIFIABLE OPERATIONS.":"BANGUN OPERASI YANG DAPAT DIVERIFIKASI."}</h3><p>{en?"Reviewed authentication and access, database migrations, linked research evidence, and recovery readiness are gates before hardware experiments.":"Autentikasi dan akses yang ditinjau, migrasi basis data, bukti riset yang tertaut, serta kesiapan pemulihan menjadi gerbang sebelum eksperimen perangkat keras."}</p><Link className={buttonClassName("primary", "btn")} href="/roadmap"><IconText icon="arrowUpRight">{en?"Explore the stages":"Telusuri tahapan"}</IconText></Link></div><div className="roadmap-rungs">{(en?["100CENTER & API", "HELIOGRID TELEMETRY", "MATERIAL SIMULATION", "COMPUTING COMPARISON", "INDEPENDENT VALIDATION"]:["100CENTER & API", "TELEMETRI HELIOGRID", "SIMULASI MATERIAL", "PEMBANDINGAN KOMPUTASI", "VALIDASI INDEPENDEN"]).map((x, i) => <div key={x}><span>{String(i + 1).padStart(2, "0")}</span><strong>{x}</strong><small>{i === 0 ? (en?"IMPLEMENTATION GATE":"GERBANG IMPLEMENTASI") : (en?"DESIGN / RESEARCH":"DIRANCANG / RISET")}</small></div>)}</div></MangaEffect>
    </section>

    <section className="closing-section"><div className="eol-container"><p className="eyebrow">{en?"A FUTURE BUILT WITH ACCOUNTABILITY":"MASA DEPAN YANG DAPAT DIPERTANGGUNGJAWABKAN"}</p><h2>{en?<>THINK <em>FURTHER.</em><br/>ACT <span>WITH EVIDENCE.</span></>:<>BERPIKIR <em>LEBIH JAUH.</em><br/>BERTINDAK <span>DENGAN BUKTI.</span></>}</h2><p>{en?"Empire of the Light is a blueprint for human-led research, learning, and services. Every technology claim needs evidence proportionate to reality.":"Empire of the Light adalah blueprint untuk riset, pembelajaran, dan layanan yang dipimpin manusia. Setiap klaim teknologi perlu bukti yang sepadan dengan kenyataannya."}</p><div className="closing-actions"><Link className={buttonClassName("primary", "btn")} href="/systems"><IconText icon="arrowUpRight">{en?"Explore the system map":"Jelajahi peta sistem"}</IconText></Link><Link className={buttonClassName("secondary", "btn")} href="/roadmap"><IconText icon="arrowUpRight">{en?"Check readiness":"Periksa kesiapan"}</IconText></Link><a className={buttonClassName("secondary", "btn")} target="_blank" rel="noopener noreferrer" href="https://github.com/bjo163/empire-of-the-light"><IconText icon="externalLink">{en?"Open repository":"Buka repositori"}</IconText></a></div></div></section>
  </>;
}
