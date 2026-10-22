import { MangaEffect } from "../src";

/** Stress fixture for decorative panel hit testing, focus outlines, and long content. */
export function MangaEffectReview() {
  return (
    <section className="catalog-section" aria-labelledby="manga-effect-review-heading">
      <div className="catalog-section-heading">
        <div>
          <p className="catalog-eyebrow">DECORATION SAFETY</p>
          <h2 id="manga-effect-review-heading">Focus and long-copy panel review</h2>
        </div>
        <p>Keyboard focus stays visible at the frame edge; decorative effects never intercept pointers or hide content.</p>
      </div>
      <div className="manga-effect-review-grid">
        <MangaEffect as="article" panel screentone className="manga-effect-review-panel manga-effect-review-panel--edge">
          <a href="#manga-effect-review-copy" className="eol-button eol-button--secondary">
            Focus target at the frame edge
          </a>
        </MangaEffect>
        <MangaEffect as="article" panel speedLines className="manga-effect-review-panel manga-effect-review-panel--copy">
          <p className="catalog-eyebrow">WRAPPING CONTENT</p>
          <h3 id="manga-effect-review-copy">A long translated heading remains inside the panel</h3>
          <p>
            Shared artwork stays behind readable content while long descriptions wrap naturally at narrow widths.
            This fixture includes a deliberately long unbroken reference string to expose clipping or horizontal spill:{" "}
            <code>https://example.invalid/research/records/2026/long-reference-without-breaks/abcdefghijklmnopqrstuvwx</code>.
          </p>
        </MangaEffect>
      </div>
    </section>
  );
}
