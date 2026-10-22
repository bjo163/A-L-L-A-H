import { IllustrationFrame, illustrationRatios, type IllustrationRatio } from "../src";

const ratioLabels: Record<IllustrationRatio, string> = {
  hero: "Hero · 16:10",
  wide: "Wide · 16:9",
  square: "Square · 1:1",
  portrait: "Portrait · 4:5",
  panoramic: "Panoramic · 21:9",
};

function VectorStudy() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 240 150" fill="none">
      <circle cx="120" cy="75" r="43" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="120" cy="75" rx="100" ry="28" stroke="currentColor" strokeWidth="2" transform="rotate(-18 120 75)" />
      <circle cx="183" cy="45" r="8" fill="currentColor" />
      <path d="M58 116h124M73 128h94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="120" cy="75" r="5" fill="currentColor" />
    </svg>
  );
}

/** Static fixture demonstrates standard ratios plus the meaningful-image contract. */
export function IllustrationFrameGallery() {
  return (
    <section className="catalog-section" aria-labelledby="illustration-frame-heading">
      <div className="catalog-section-heading">
        <div><p className="catalog-eyebrow">PACKAGE ILLUSTRATION CONTRACT</p><h2 id="illustration-frame-heading">One frame, five standard ratios</h2></div>
        <p>Illustrations share responsive dimensions, intentional clipping, theme surfaces, and an explicit decorative or meaningful accessible-name contract.</p>
      </div>
      <div className="illustration-frame-gallery">
        {illustrationRatios.map((ratio) => (
          <article className="illustration-frame-gallery__item" key={ratio}>
            <IllustrationFrame ratio={ratio} decorative><VectorStudy /></IllustrationFrame>
            <h3>{ratioLabels[ratio]}</h3>
          </article>
        ))}
      </div>
      <div className="illustration-frame-gallery__meaningful">
        <IllustrationFrame ratio="square" label="An orbital diagram with one center and one satellite"><VectorStudy /></IllustrationFrame>
        <p><strong>Meaningful art:</strong> supply a concise label. Decorative art opts out of the accessibility tree.</p>
      </div>
    </section>
  );
}
