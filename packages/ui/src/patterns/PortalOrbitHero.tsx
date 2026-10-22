import type { ReactNode } from "react";
import { MangaEffect } from "./MangaEffect";
import { MangaOrbit } from "./MangaOrbit";
import { MangaSfx } from "./MangaSfx";

export type OrbitSatellite = { id: string; label: ReactNode; caption: ReactNode };
export type PortalOrbitHeroProps = {
  ariaLabel: string;
  visualLabel: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  clarity: ReactNode;
  centerLabel: ReactNode;
  centerCaption: ReactNode;
  satellites: readonly OrbitSatellite[];
  coordinates: ReactNode;
  stamp: ReactNode;
  soundEffect: string;
  watermark: ReactNode;
};

/** Portal's editorial hero composition; product copy and route actions stay in the consumer. */
export function PortalOrbitHero({
  ariaLabel, visualLabel, eyebrow, title, description, actions, clarity, centerLabel, centerCaption,
  satellites, coordinates, stamp, soundEffect, watermark,
}: PortalOrbitHeroProps) {
  return <MangaEffect as="section" reveal className="hero eol-container" aria-label={ariaLabel}>
    <div className="hero-copy">
      <p className="eyebrow"><span className="eyebrow-bar"/> {eyebrow}</p>
      <h1>{title}</h1>
      <p className="hero-lede">{description}</p>
      <div className="hero-buttons">{actions}</div>
      <p className="hero-clarity"><span className="pulse-dot"/> {clarity}</p>
    </div>
    <MangaEffect panel spin className="hero-visual" role="img" aria-label={visualLabel}>
      <div className="visual-stars" aria-hidden="true"/>
      <MangaOrbit variant="primary" className="orbit orbit-one"/>
      <MangaOrbit variant="secondary" className="orbit orbit-two"/>
      <MangaOrbit variant="tertiary" className="orbit orbit-three"/>
      <div className="orbital-axis" aria-hidden="true"/><div className="core-halo" aria-hidden="true"/>
      <MangaSfx className="hero-sfx" text={soundEffect}/>
      <span className="hero-stamp" aria-hidden="true">{stamp}</span>
      <div className="visual-core"><div className="core-symbol">A</div><span>A-L-L-A-H</span><small>{centerLabel} · {centerCaption}</small></div>
      {satellites.map((satellite, index) => <div className={`satellite satellite-${String.fromCharCode(97 + index)}`} key={satellite.id}>
        <span className="sat-point"/> {satellite.label} <small>{satellite.caption}</small>
      </div>)}
      <div className="visual-coordinates">{coordinates}</div><div className="visual-floor" aria-hidden="true"/>
    </MangaEffect>
    <div className="hero-watermark" aria-hidden="true">{watermark}</div>
  </MangaEffect>;
}
