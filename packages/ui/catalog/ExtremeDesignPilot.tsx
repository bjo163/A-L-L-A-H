import { Badge, buttonClassName, MangaEffect, MangaSfx, Panel } from "../src";

type ExtremeDesignPilotProps = {
  language: "en" | "id";
};

/**
 * Isolated art-direction pilot. It deliberately uses shared UI primitives and
 * package tokens while keeping the extreme visual treatment scoped to catalog.
 */
export function ExtremeDesignPilot({ language }: ExtremeDesignPilotProps) {
  const en = language === "en";

  return (
    <section className="catalog-section extreme-pilot-section" aria-labelledby="extreme-pilot-heading">
      <div className="catalog-section-heading">
        <div>
          <p className="catalog-eyebrow">ART DIRECTION PILOT · 01</p>
          <h2 id="extreme-pilot-heading">Funky. Grunge. Gen Z. <span>Extreme.</span></h2>
        </div>
        <p>
          {en
            ? "A contained visual prototype using existing shared primitives. Review the visual intensity before applying it to production routes."
            : "Prototipe visual terisolasi yang memakai primitive bersama. Tinjau intensitas visual sebelum diterapkan ke route produksi."}
        </p>
      </div>

      <div className="extreme-pilot" data-visual-profile="extreme">
        <div className="extreme-pilot__topline">
          <span>EMPIRE OF THE LIGHT / UI-EX-01</span>
          <Badge tone="warning">{en ? "EXPERIMENTAL" : "EKSPERIMENTAL"}</Badge>
        </div>

        <div className="extreme-pilot__hero">
          <div className="extreme-pilot__copy">
            <p className="extreme-pilot__eyebrow">{en ? "THE NEW VISUAL LANGUAGE" : "BAHASA VISUAL BARU"}</p>
            <h3>
              {en ? <>MAKE A LITTLE NOISE.<br /><em>MAKE IT MEAN.</em></> : <>BIKIN RAMAI.<br /><em>TETAP BERMAKNA.</em></>}
            </h3>
            <p className="extreme-pilot__description">
              {en
                ? "Raw edges. Loud type. Useful interfaces. A design system with a pulse—not visual chaos without purpose."
                : "Garis kasar. Tipografi berani. Antarmuka yang berguna. Design system yang hidup—bukan berantakan tanpa tujuan."}
            </p>
            <div className="extreme-pilot__actions">
              <a className={buttonClassName("primary")} href="#preview-controls-heading">{en ? "Explore the system" : "Jelajahi sistem"}</a>
              <a className={buttonClassName("secondary")} href="#tokens-heading">{en ? "Read the principles" : "Baca prinsip"}</a>
            </div>
          </div>

          <MangaEffect as="div" panel screentone className="extreme-pilot__art" aria-hidden="true">
            <span className="extreme-pilot__art-index">NO. 001 / SIGNAL</span>
            <span className="extreme-pilot__burst" aria-hidden="true" />
            <span className="extreme-pilot__orbit" aria-hidden="true" />
            <MangaSfx text="ZAP!" className="extreme-pilot__sfx" />
            <span className="extreme-pilot__art-caption">{en ? "STRUCTURE THE CHAOS" : "STRUKTURKAN KEKACAUAN"}</span>
          </MangaEffect>
        </div>

        <div className="extreme-pilot__principles">
          <Panel as="article" className="extreme-pilot__principle extreme-pilot__principle--funky">
            <span className="extreme-pilot__number">01</span>
            <h4>FUNKY</h4>
            <p>{en ? "Expressive composition. Unexpected rhythm. Playful energy." : "Komposisi ekspresif. Ritme tak terduga. Energi yang berani."}</p>
          </Panel>
          <Panel as="article" className="extreme-pilot__principle extreme-pilot__principle--grunge">
            <span className="extreme-pilot__number">02</span>
            <h4>GRUNGE</h4>
            <p>{en ? "Rough ink, hard edges, collage, and controlled texture." : "Tinta kasar, garis tegas, kolase, dan tekstur terkontrol."}</p>
          </Panel>
          <Panel as="article" className="extreme-pilot__principle extreme-pilot__principle--genz">
            <span className="extreme-pilot__number">03</span>
            <h4>GEN Z</h4>
            <p>{en ? "Fast to scan. Native to screens. Responsive by default." : "Cepat dipahami. Akrab di layar. Responsif sejak awal."}</p>
          </Panel>
        </div>

        <div className="extreme-pilot__footer">
          <span>{en ? "ONE DESIGN DNA" : "SATU DNA DESAIN"}</span>
          <span aria-hidden="true">✳</span>
          <span>{en ? "MANY PRODUCT IDENTITIES" : "BANYAK IDENTITAS PRODUK"}</span>
        </div>
      </div>
      <p className="catalog-caption">
        {en
          ? "Pilot only: this section does not change Portal production styling. Theme colors come from the existing package token system."
          : "Khusus pilot: bagian ini tidak mengubah styling Portal produksi. Warna tema memakai sistem token package yang sudah ada."}
      </p>
    </section>
  );
}
