import type { ReactNode, SVGProps } from "react";
import { Badge } from "../primitives/Badge";
import { buttonClassName } from "../primitives/Button";
import { Panel } from "../primitives/Panel";
import { TextField } from "../primitives/TextField";
import { OrbitMark } from "./OrbitMark.generated";

export type BrandConcept = "aperture" | "orbit" | "monogram";

/**
 * Shared working mark for product shells. Orbit is provisional: the brand
 * concept and final logo system remain subject to the C02 review gate.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return <BrandConceptMark concept="orbit" className="eol-logo-mark" {...props} />;
}

export type BrandLockupProps = {
  name: ReactNode;
  descriptor: ReactNode;
  size?: "regular" | "compact";
  layout?: "horizontal" | "stacked";
  tone?: "default" | "subtle";
  className?: string;
};

/** Shared product lockup; its visible name and descriptor supply its text name. */
export function BrandLockup({ name, descriptor, size = "regular", layout = "horizontal", tone = "default", className = "" }: BrandLockupProps) {
  const classes = ["eol-brand-lockup", `eol-brand-lockup--${size}`, `eol-brand-lockup--${layout}`, `eol-brand-lockup--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={classes}>
      <span className="eol-brand-lockup__mark" aria-hidden="true"><LogoMark /></span>
      <span className="eol-brand-lockup__text">
        <strong className="eol-brand-lockup__name">{name}</strong>
        <small className="eol-brand-lockup__descriptor">{descriptor}</small>
      </span>
    </span>
  );
}

const conceptNames: Record<BrandConcept, string> = {
  aperture: "Aperture",
  orbit: "Orbit",
  monogram: "Monogram",
};

/** Early vector identity studies; the Orbit working mark is provisional. */
export function BrandConceptMark({
  concept,
  ...props
}: SVGProps<SVGSVGElement> & { concept: BrandConcept }) {
  if (concept === "orbit") return <OrbitMark {...props} />;
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
            <div className="brand-concept__lockup brand-concept__lockup--stacked">
              <BrandConceptMark concept={concept} className="brand-concept__lockup-mark" />
              <span><strong>A-L-L-A-H</strong><small>STACKED LOCKUP</small></span>
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
