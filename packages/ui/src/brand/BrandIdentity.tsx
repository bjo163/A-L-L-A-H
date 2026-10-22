import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import { OrbitMark } from "./OrbitMark.generated";
import { OrbitMarkSmall } from "./OrbitMarkSmall.generated";

export type BrandConcept = "aperture" | "orbit" | "monogram";

/**
 * Shared working mark for product shells. Orbit is provisional: the brand
 * concept and final logo system remain subject to the C02 review gate.
 */
export type LogoMarkProps = { className?: string; opticalSize?: "standard" | "small" };

export function LogoMark({ className, opticalSize = "standard" }: LogoMarkProps = {}) {
  return <BrandConceptMark concept="orbit" opticalSize={opticalSize} className={classNames("eol-logo-mark", className)} />;
}

export type BrandLockupProps = {
  name: ReactNode;
  descriptor: ReactNode;
  size?: "regular" | "compact";
  layout?: "horizontal" | "stacked";
  tone?: "default" | "subtle";
  className?: string;
};

/** Package-internal lockup frame used by the catalog to compare provisional marks. */
export type BrandLockupFrameProps = BrandLockupProps & { mark: ReactNode };

/** Shared lockup structure for catalog-only concept studies; not part of the public barrel. */
export function BrandLockupFrame({ mark, name, descriptor, size = "regular", layout = "horizontal", tone = "default", className = "" }: BrandLockupFrameProps) {
  const classes = ["eol-brand-lockup", `eol-brand-lockup--${size}`, `eol-brand-lockup--${layout}`, `eol-brand-lockup--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={classes}>
      <span className="eol-brand-lockup__mark" aria-hidden="true">{mark}</span>
      <span className="eol-brand-lockup__text">
        <strong className="eol-brand-lockup__name">{name}</strong>
        <small className="eol-brand-lockup__descriptor">{descriptor}</small>
      </span>
    </span>
  );
}

/** Shared product lockup; its visible name and descriptor supply its text name. */
export function BrandLockup({ name, descriptor, size = "regular", layout = "horizontal", tone = "default", className = "" }: BrandLockupProps) {
  return (
    <BrandLockupFrame mark={<LogoMark />} name={name} descriptor={descriptor} size={size} layout={layout} tone={tone} className={className} />
  );
}

/** Early vector identity studies; the Orbit working mark is provisional. */
export function BrandConceptMark({ concept, className, opticalSize = "standard" }: LogoMarkProps & { concept: BrandConcept }) {
  if (concept === "orbit") return opticalSize === "small" ? <OrbitMarkSmall className={className} /> : <OrbitMark className={className} />;
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 72 72"
      fill="none"
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
