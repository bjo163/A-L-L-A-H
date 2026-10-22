import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";
import { MangaEffect } from "./MangaEffect";
import { MangaOrbit } from "./MangaOrbit";
import { MangaSfx } from "./MangaSfx";

export type MangaTelemetryHeroProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  pulse: ReactNode;
  sfx: string;
  className?: string;
};

/** Shared telemetry hero with the package's manga panel, orbit, motion, and SFX. */
export function MangaTelemetryHero({
  eyebrow,
  title,
  description,
  metadata,
  pulse,
  sfx,
  className,
}: MangaTelemetryHeroProps) {
  return (
    <MangaEffect as="section" panel speedLines reveal className={classNames("eol-manga-telemetry-hero", className)}>
      <div className="eol-manga-telemetry-hero__content">
        <p className="eol-manga-telemetry-hero__eyebrow">{eyebrow}</p>
        <h2 className="eol-manga-telemetry-hero__title">{title}</h2>
        {description && <p className="eol-manga-telemetry-hero__description">{description}</p>}
        {metadata && <div className="eol-manga-telemetry-hero__metadata">{metadata}</div>}
      </div>
      <MangaSfx text={sfx} className="eol-manga-telemetry-hero__sfx" />
      <div className="eol-manga-telemetry-hero__orbit">
        <span>{pulse}</span>
        <MangaOrbit className="eol-manga-telemetry-hero__ring eol-manga-telemetry-hero__ring--inner" />
        <MangaOrbit className="eol-manga-telemetry-hero__ring eol-manga-telemetry-hero__ring--outer" />
        <i aria-hidden="true" />
        <b aria-hidden="true" />
      </div>
    </MangaEffect>
  );
}
