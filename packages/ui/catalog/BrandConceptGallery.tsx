import { useState } from "react";
import { Badge } from "../src/primitives/Badge";
import { buttonClassName } from "../src/primitives/Button";
import { FieldLabel } from "../src/primitives/FieldLabel";
import { Panel } from "../src/primitives/Panel";
import { SelectField } from "../src/primitives/SelectField";
import { TextField } from "../src/primitives/TextField";
import { empireMarkFullBrandSvg, empireMarkInverseSvg, empireMarkMonochromeSvg, empireMarkSmall16Svg, empireMarkSmall24Svg, empireMarkSmall32Svg } from "../src/brand/BrandAssets.generated";
import { BrandConceptMark, BrandLockupFrame } from "../src/brand/BrandIdentity";
import type { BrandConcept } from "../src/brand/BrandIdentity";

const conceptNames: Record<BrandConcept, string> = {
  aperture: "Aperture",
  orbit: "Orbit",
  monogram: "Monogram",
};

const brandReviewCriteria = [
  { id: "smallLegibility", label: { en: "Small-size legibility", id: "Keterbacaan ukuran kecil" }, weight: 25, prompt: { en: "16/24/32px; details stay open and recognizable.", id: "16/24/32px; detail tetap terbuka dan mudah dikenali." } },
  { id: "familyCohesion", label: { en: "Family cohesion", id: "Kesatuan keluarga" }, weight: 20, prompt: { en: "Fits the parent identity, Portal, and workspace.", id: "Cocok untuk identitas induk, Portal, dan workspace." } },
  { id: "distinctiveness", label: { en: "Distinctiveness", id: "Kekhasan" }, weight: 20, prompt: { en: "Avoids generic shapes or confusion with other marks.", id: "Tidak mudah tertukar dengan bentuk generik atau merek lain." } },
  { id: "mediaAdaptation", label: { en: "Media adaptation", id: "Adaptasi media" }, weight: 15, prompt: { en: "Header, sidebar, favicon, light, dark, and grayscale.", id: "Header, sidebar, favicon, terang, gelap, dan grayscale." } },
  { id: "svgQuality", label: { en: "SVG quality", id: "Kebersihan SVG" }, weight: 10, prompt: { en: "Clean geometry, stable scaling, safe and maintainable source.", id: "Geometri rapi, stabil saat diskala, aman dan mudah dirawat." } },
  { id: "semanticFit", label: { en: "Semantic fit", id: "Kesesuaian makna" }, weight: 10, prompt: { en: "Fits the brief without implying authority.", id: "Selaras dengan brief tanpa menyiratkan klaim otoritas." } },
] as const;

type BrandReviewCriterion = (typeof brandReviewCriteria)[number]["id"];
type BrandReviewScores = Partial<Record<BrandConcept, Partial<Record<BrandReviewCriterion, number>>>>;
type CatalogLanguage = "en" | "id";

const scorecardCopy: Record<CatalogLanguage, { title: string; instructions: string; caution: string; legend: string; choose: string; score: (value: number) => string; pending: (count: number) => string }> = {
  en: {
    title: "Weighted review worksheet",
    instructions: "Score 1–5 after reviewing the simulations. 1 = weak, 3 = usable with compromises, 5 = excellent. Scores stay in this tab and are not saved.",
    caution: "Record observed trade-offs; do not infer legibility or distinctiveness from source geometry alone.",
    legend: "Weighted score criteria",
    choose: "Score",
    score: (value) => `Weighted score: ${value.toFixed(2)} / 5`,
    pending: (count) => `${count} criteria remain before a weighted score is shown.`,
  },
  id: {
    title: "Lembar penilaian berbobot",
    instructions: "Beri nilai 1–5 setelah memeriksa simulasi. 1 = lemah, 3 = cukup dengan kompromi, 5 = sangat kuat. Nilai hanya berlaku di tab ini dan tidak disimpan.",
    caution: "Catat kompromi yang terlihat; jangan menyimpulkan keterbacaan atau kekhasan hanya dari geometri sumber.",
    legend: "Kriteria skor berbobot",
    choose: "Nilai",
    score: (value) => `Skor tertimbang: ${value.toFixed(2)} / 5`,
    pending: (count) => `Lengkapi ${count} kriteria untuk melihat skor tertimbang.`,
  },
};

const conceptReviewCautions: Record<BrandConcept, Record<CatalogLanguage, string>> = {
  aperture: {
    en: "Check that the opening stays clear at 16/24px and the nested shape does not read as a generic hexagon.",
    id: "Periksa apakah bukaan tetap jelas pada 16/24px dan bentuk berlapis tidak terbaca sebagai heksagon generik.",
  },
  orbit: {
    en: "Check that both ellipses stay separate at small sizes; orbital marks are common and need a distinctive cue.",
    id: "Periksa apakah dua elips tetap terpisah pada ukuran kecil; orbit adalah metafora umum dan perlu ciri yang khas.",
  },
  monogram: {
    en: "Check whether it reads as a generic A or an A-L-L-A-H-only initial rather than the full product family.",
    id: "Periksa apakah bentuk terbaca sebagai A generik atau hanya mewakili A-L-L-A-H, bukan seluruh keluarga produk.",
  },
};

function BrandConceptScorecard({ concept, language }: { concept: BrandConcept; language: CatalogLanguage }) {
  const [scores, setScores] = useState<BrandReviewScores>({});
  const conceptScores = scores[concept] ?? {};
  const missingCount = brandReviewCriteria.filter(({ id }) => conceptScores[id] === undefined).length;
  const weightedScore = brandReviewCriteria.reduce((total, { id, weight }) => total + (conceptScores[id] ?? 0) * weight, 0) / 100;
  const copy = scorecardCopy[language];

  return (
    <section className="brand-concept__scorecard" aria-labelledby={`brand-scorecard-${concept}`}>
      <h4 id={`brand-scorecard-${concept}`}>{copy.title}</h4>
      <p className="brand-scorecard__instructions">{copy.instructions}</p>
      <p className="brand-scorecard__caution">{conceptReviewCautions[concept][language]} {copy.caution}</p>
      <fieldset className="brand-scorecard__criteria">
        <legend className="brand-scorecard__legend">{conceptNames[concept]} · {copy.legend}</legend>
        {brandReviewCriteria.map(({ id, label, weight, prompt }) => (
          <FieldLabel className="brand-scorecard__criterion" key={id}>
            <span className="brand-scorecard__criterion-copy">
              <span>{label[language]} <small>{weight}%</small></span>
              <small>{prompt[language]}</small>
            </span>
            <SelectField
              aria-label={`${conceptNames[concept]}: ${label[language]} (${weight}%)`}
              value={conceptScores[id] ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setScores((current) => ({
                  ...current,
                  [concept]: { ...current[concept], [id]: value ? Number(value) : undefined },
                }));
              }}
            >
              <option value="">{copy.choose}</option>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
            </SelectField>
          </FieldLabel>
        ))}
      </fieldset>
      <p className="brand-scorecard__result" aria-live="polite">
        {missingCount ? copy.pending(missingCount) : copy.score(weightedScore)}
      </p>
    </section>
  );
}

/** Side-by-side identity study for review in the UI catalog. */
export function BrandConcepts({ language = "en" }: { language?: CatalogLanguage }) {
  const concepts: BrandConcept[] = ["aperture", "orbit", "monogram"];

  return (
    <div className="brand-concepts">
      {concepts.map((concept) => (
        <article className="brand-concept" key={concept}>
          <div className="brand-concept__heading">
            <BrandConceptMark concept={concept} className="brand-concept__mark" />
            <div>
              <h3>{conceptNames[concept]}</h3>
              <p>Empire of the Light</p>
            </div>
          </div>
          <div className="brand-concept__previews">
            <BrandLockupFrame className="brand-concept__lockup" mark={<BrandConceptMark concept={concept} className="eol-logo-mark" />} name="A-L-L-A-H" descriptor="PUBLIC PORTAL" />
            <BrandLockupFrame className="brand-concept__lockup brand-concept__lockup--compact" mark={<BrandConceptMark concept={concept} className="eol-logo-mark" />} name="100CENTER" descriptor="OPERATOR WORKSPACE" size="compact" />
            <BrandLockupFrame className="brand-concept__lockup brand-concept__lockup--stacked" mark={<BrandConceptMark concept={concept} className="eol-logo-mark" />} name="A-L-L-A-H" descriptor="STACKED LOCKUP" layout="stacked" />
            <div className="brand-concept__favicon">
              <BrandConceptMark concept={concept} opticalSize="small" />
              <small>32px</small>
            </div>
          </div>
          <div className="brand-concept__screens" aria-label={`${conceptNames[concept]} context previews`}>
            <Panel as="section" className="brand-concept__screen brand-concept__screen--hero">
              <BrandLockupFrame className="brand-concept__screen-brand" mark={<BrandConceptMark concept={concept} className="eol-logo-mark" />} name="A-L-L-A-H" descriptor="PUBLIC PORTAL" size="compact" />
              <strong>Human-led,<br />evidence ready.</strong>
              <span aria-hidden="true" className={buttonClassName("secondary")}>Explore systems</span>
            </Panel>
            <Panel as="section" className="brand-concept__screen brand-concept__screen--workspace">
              <BrandLockupFrame className="brand-concept__screen-brand" mark={<BrandConceptMark concept={concept} className="eol-logo-mark" />} name="100CENTER" descriptor="OPERATIONS" size="compact" />
              <div className="brand-concept__screen-row"><span>API boundary</span><Badge tone="success">Ready</Badge></div>
              <div className="brand-concept__screen-row"><span>Research review</span><Badge tone="warning">Pending</Badge></div>
              <TextField aria-label="Search this view" placeholder="Search this view" readOnly />
            </Panel>
            <Panel as="section" className="brand-concept__screen brand-concept__screen--dialog">
              <span className="catalog-eyebrow">CONFIRMATION</span>
              <strong>Review this change?</strong>
              <span>Approval will be recorded for the selected proposal.</span>
              <div aria-hidden="true"><span className={buttonClassName("secondary")}>Cancel</span><span className={buttonClassName()}>Review</span></div>
            </Panel>
          </div>
          <BrandConceptScorecard concept={concept} language={language} />
        </article>
      ))}
    </div>
  );
}

const standaloneBrandVariants = [
  { name: "Full brand", color: "#f1b84b", svg: empireMarkFullBrandSvg, surface: "brand-variant-preview--full-brand" },
  { name: "Monochrome", color: "#201832", svg: empireMarkMonochromeSvg, surface: "brand-variant-preview--monochrome" },
  { name: "Inverse", color: "#ffffff", svg: empireMarkInverseSvg, surface: "brand-variant-preview--inverse" },
] as const;

/** Catalog-only presentation of manifest-tracked standalone brand color outputs. */
export function BrandVariantPreviews() {
  return <ul className="brand-variant-gallery" aria-label="Generated standalone brand color variants">
    {standaloneBrandVariants.map((variant) => (
      <li className={`brand-variant-preview ${variant.surface}`} key={variant.name}>
        <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(variant.svg)}`} alt="" aria-hidden="true" />
        <span><strong>{variant.name}</strong><small>{variant.color}</small></span>
      </li>
    ))}
  </ul>;
}

const opticalSizeSamples = [
  { size: 16, standard: empireMarkFullBrandSvg, optical: empireMarkSmall16Svg },
  { size: 24, standard: empireMarkFullBrandSvg, optical: empireMarkSmall24Svg },
  { size: 32, standard: empireMarkFullBrandSvg, optical: empireMarkSmall32Svg },
] as const;

/** Compare generated geometry at representative small display sizes. */
export function BrandOpticalSizePreviews() {
  return <section className="brand-optical-review" aria-labelledby="brand-optical-review-heading">
    <h3 id="brand-optical-review-heading">Small-size optical study</h3>
    <div className="brand-optical-size-gallery">
      {opticalSizeSamples.map(({ size, standard, optical }) => (
        <figure className="brand-optical-size-sample" key={size}>
          <div className="brand-optical-size-sample__pair">
            <span><img className="brand-optical-size-sample__mark" data-size={size} src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(standard)}`} alt="" aria-hidden="true" /><small>Master</small></span>
            <span><img className="brand-optical-size-sample__mark" data-size={size} src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(optical)}`} alt="" aria-hidden="true" /><small>Optical</small></span>
          </div>
          <figcaption>{size}px</figcaption>
        </figure>
      ))}
    </div>
    <p>The small source raises outline weight and simplifies the orbit for comparison; final legibility still needs rendered review.</p>
  </section>;
}
