import type { SVGProps } from "react";
import { Badge } from "../primitives/Badge";
import { buttonClassName } from "../primitives/Button";
import { Panel } from "../primitives/Panel";
import { TextField } from "../primitives/TextField";

export type BrandConcept = "aperture" | "orbit" | "monogram";

const conceptNames: Record<BrandConcept, string> = {
  aperture: "Aperture",
  orbit: "Orbit",
  monogram: "Monogram",
};

/** Early vector identity studies. Keep these out of product headers until a concept is selected. */
export function BrandConceptMark({
  concept,
  ...props
}: SVGProps<SVGSVGElement> & { concept: BrandConcept }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 72 72"
      fill="none"
      {...props}
    >
      {concept === "aperture" ? (
        <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
          <path d="M36 5 59 18v29L36 66 13 47V18L36 5Z" />
          <path d="m36 19 17 10-3 19-18 9-14-14 5-17 13-7Z" />
          <path d="m36 19 1 16 13 13M19 43l18-8 16-6" opacity=".72" />
        </g>
      ) : concept === "orbit" ? (
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="36" cy="36" r="9" fill="currentColor" />
          <ellipse cx="36" cy="36" rx="29" ry="12" transform="rotate(-35 36 36)" />
          <ellipse cx="36" cy="36" rx="29" ry="12" transform="rotate(35 36 36)" opacity=".75" />
          <circle cx="59" cy="22" r="4" fill="currentColor" stroke="none" />
          <circle cx="14" cy="47" r="3" fill="currentColor" stroke="none" />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 60 36 10l24 50M22 40h28M29 52h14" />
          <path d="M8 62h56" opacity=".65" />
        </g>
      )}
    </svg>
  );
}

/** Side-by-side identity study for review in the UI catalog. */
export function BrandConcepts() {
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
            <div className="brand-concept__lockup">
              <BrandConceptMark concept={concept} className="brand-concept__lockup-mark" />
              <span><strong>A-L-L-A-H</strong><small>PUBLIC PORTAL</small></span>
            </div>
            <div className="brand-concept__lockup brand-concept__lockup--compact">
              <BrandConceptMark concept={concept} className="brand-concept__lockup-mark" />
              <span><strong>100CENTER</strong><small>OPERATOR WORKSPACE</small></span>
            </div>
            <div className="brand-concept__favicon">
              <BrandConceptMark concept={concept} />
              <small>32px</small>
            </div>
          </div>
          <div className="brand-concept__screens" aria-label={`${conceptNames[concept]} context previews`}>
            <Panel as="section" className="brand-concept__screen brand-concept__screen--hero">
              <div className="brand-concept__screen-brand">
                <BrandConceptMark concept={concept} className="brand-concept__screen-mark" />
                <span>A-L-L-A-H <small>PUBLIC PORTAL</small></span>
              </div>
              <strong>Human-led,<br />evidence ready.</strong>
              <span aria-hidden="true" className={buttonClassName("secondary")}>Explore systems</span>
            </Panel>
            <Panel as="section" className="brand-concept__screen brand-concept__screen--workspace">
              <div className="brand-concept__screen-brand">
                <BrandConceptMark concept={concept} className="brand-concept__screen-mark" />
                <span>100CENTER <small>OPERATIONS</small></span>
              </div>
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
        </article>
      ))}
    </div>
  );
}
