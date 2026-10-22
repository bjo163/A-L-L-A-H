import { createRoot } from "react-dom/client";
import { BrandLockup } from "../src/brand/BrandConcepts";
import { buttonClassName, CallToAction, IconText, MetricGrid, PortalDomainCard, PublicShell, ResponsiveNavigation, SectionHeading } from "../src";
import "./preview.css";

const params = new URLSearchParams(window.location.search);
const language = params.get("language") === "id" ? "id" : "en";
const density = params.get("density") === "compact" ? "compact" : "comfortable";
const english = language === "en";

function ResponsiveFixture() {
  const navLabel = english ? "Preview navigation" : "Navigasi pratinjau";
  return <div className="catalog-responsive-preview" lang={language} data-density={density}>
    <PublicShell
      className="catalog-responsive-shell"
      brand={<BrandLockup name="A-L-L-A-H" descriptor={english ? "PUBLIC PORTAL" : "PORTAL PUBLIK"}/>}
      navigation={<ResponsiveNavigation label={navLabel} openLabel={english ? "Open menu" : "Buka menu"} closeLabel={english ? "Close menu" : "Tutup menu"} resetKey={language} linksClassName="desktop-nav">
        <a href="#preview-domains">{english ? "Domains" : "Domain"}</a>
        <a href="#preview-metrics">{english ? "Evidence" : "Bukti"}</a>
        <a href="#preview-actions">{english ? "Next steps" : "Langkah lanjut"}</a>
      </ResponsiveNavigation>}
      action={<a className={buttonClassName("primary", "btn")} href="#preview-actions">{english ? "Explore" : "Jelajahi"}</a>}
      skipLabel={english ? "Skip to preview content" : "Lewati ke konten pratinjau"}
      footerBrand={<BrandLockup size="compact" name="A-L-L-A-H" descriptor="UI PREVIEW"/>}
      footerContent={<><a href="#preview-domains">{english ? "Domains" : "Domain"}</a><a href="#preview-actions">{english ? "Continue" : "Lanjut"}</a></>}
    >
      <>
        <section className="page-hero eol-container">
          <p className="eyebrow">{english ? "PACKAGE RESPONSIVE FIXTURE" : "FIXTURE RESPONSIF PACKAGE"}</p>
          <h1>{english ? <>ONE SYSTEM.<br/><em>EVERY SCREEN.</em></> : <>SATU SISTEM.<br/><em>SEMUA LAYAR.</em></>}</h1>
          <p>{english ? "The iframe width is the actual CSS viewport for this shared Portal composition." : "Lebar iframe menjadi viewport CSS sebenarnya untuk komposisi Portal bersama ini."}</p>
          <div className="catalog-preview-actions">
            <a className={buttonClassName("primary", "btn")} href="#preview-domains"><IconText icon="arrowDownRight">{english ? "View domains" : "Lihat domain"}</IconText></a>
            <a className={buttonClassName("secondary", "btn")} href="#preview-actions">{english ? "Review next steps" : "Tinjau langkah lanjut"}</a>
          </div>
        </section>
        <div className="catalog-responsive-preview__body">
          <section className="section" id="preview-domains">
            <div className="catalog-preview-body">
              <div className="catalog-preview-intro"><SectionHeading layout="section" eyebrowClassName="eyebrow" eyebrow={english ? "SHARED DOMAIN CARDS" : "KARTU DOMAIN BERSAMA"} title={english ? <>A clear role for <em>each system.</em></> : <>Peran yang jelas untuk <em>setiap sistem.</em></>}/><p>{english ? "Bilingual labels, statuses, and accents stay visible as this layout changes width." : "Label bilingual, status, dan aksen tetap terlihat saat layout berubah lebar."}</p></div>
              <div className="catalog-preview-cards">
                <PortalDomainCard id="preview-arsy" index="01" accent="mint" icon="agent" status={english ? "DESIGN" : "RANCANGAN"} statusTone="info" descriptor={english ? "AGENCY & ORCHESTRATION" : "AGENCY & ORKESTRASI"} title="ARSY" summary={english ? "Agents, tools, evidence, and accountable workflows." : "Agen, alat, bukti, dan alur kerja yang dapat ditinjau."} action={<a className="card-link" href="#preview-actions">{english ? "Read the overview" : "Baca ringkasan"}</a>}/>
                <PortalDomainCard id="preview-energy" index="02" accent="amber" icon="activity" status={english ? "DESIGN" : "RANCANGAN"} statusTone="info" descriptor={english ? "POWER & MEASUREMENT" : "DAYA & PENGUKURAN"} title="HELIOGRID" summary={english ? "Measured energy systems with explicit safety boundaries." : "Sistem energi terukur dengan batas keselamatan yang jelas."} action={<a className="card-link" href="#preview-actions">{english ? "Read the overview" : "Baca ringkasan"}</a>}/>
                <PortalDomainCard id="preview-ziil" index="03" accent="gold" icon="approval" status={english ? "FOUNDATION" : "FONDASI"} statusTone="success" descriptor={english ? "RIGHTS & SAFETY" : "HAK & KESELAMATAN"} title="ZIIL" summary={english ? "People retain authority, privacy, review, and appeal." : "Manusia memegang otoritas, privasi, tinjauan, dan banding."} action={<a className="card-link" href="#preview-actions">{english ? "Read the overview" : "Baca ringkasan"}</a>}/>
              </div>
              <div id="preview-metrics" className="catalog-preview-metrics"><MetricGrid density={density} profile="editorial" items={[
                { value: "06", label: english ? "Technology domains" : "Domain teknologi" },
                { value: "02", label: english ? "Theme variants" : "Varian tema" },
                { value: "01", label: english ? "Shared package" : "Package bersama" },
              ]}/></div>
            </div>
          </section>
          <CallToAction
            eyebrow={english ? "ACCOUNTABLE BY DESIGN" : "AKUNTABEL SEJAK DESAIN"}
            title={english ? <>Think <em>further.</em><br/>Act <span>with evidence.</span></> : <>Berpikir <em>lebih jauh.</em><br/>Bertindak <span>dengan bukti.</span></>}
            description={english ? "A shared composition should remain readable and useful at every reviewed viewport." : "Komposisi bersama harus tetap terbaca dan berguna pada setiap viewport yang ditinjau."}
            actions={<a className={buttonClassName("primary", "btn")} href="#preview-domains">{english ? "Return to domains" : "Kembali ke domain"}</a>}
            className="catalog-preview-closing"
          />
        </div>
      </>
    </PublicShell>
  </div>;
}

const root = document.getElementById("preview-root");
if (!root) throw new Error("Missing responsive preview root");
createRoot(root).render(<ResponsiveFixture/>);
