import Link from "next/link";
import type { WebLanguage } from "../lib/i18n";
import type { ReactNode } from "react";
import { MoonwitnessCrown as Crown } from "@empire/ui";

const stories = [
  { id: "jakarta", title: "A SMALL TOWN STILL LOOKS UP", place: "JAKARTA, IDN", tone: "pink" },
  { id: "seoul", title: "SAME MOON, DIFFERENT DREAMS", place: "SEOUL, KR", tone: "blue" },
  { id: "lisbon", title: "FAR BUT UNDER THE SAME MOON.", place: "LISBON, PT", tone: "violet" },
  { id: "manila", title: "STILL HERE. STILL HUMAN.", place: "MANILA, PH", tone: "yellow" },
];

function MoonMark() {
  return <span className="mw-mark" aria-hidden="true"><span>M</span><i>✦</i></span>;
}

function Badge({ children, tone = "pink" }: { children: ReactNode; tone?: string }) {
  return <span className={`mw-badge mw-badge--${tone}`}>{children}</span>;
}

export function MoonwitnessExperience({ language: _language }: { language: WebLanguage }) {
  return <div className="mw-site">
    <section className="mw-hero" aria-labelledby="mw-title">
      <div className="mw-hero-art" role="img" aria-label="A hooded witness looking over a city toward a bright blue moon" />
      <div className="mw-hero-splatter" aria-hidden="true">✳</div>
      <div className="mw-hero-copy">
        <p className="mw-kicker">REAL PEOPLE. UNFILTERED WORLDS.<br/>A BRIGHTER US.</p>
        <h1 id="mw-title"><span>MOON</span><em>WITNESS</em></h1>
        <Link href="#stories" className="mw-yellow-ribbon">FOLLOW THE SIGNAL <span>↗</span></Link>
        <p className="mw-hero-tagline">DIFFERENT PEOPLE. SAME SKY.<br/><b>STORIES BEYOND BORDERS.</b></p>
        <div className="mw-hero-actions"><Link href="#stories" className="mw-button mw-button--paper">EXPLORE STORIES <span>→</span></Link><Link href="#manifesto" className="mw-watch"><span className="mw-play">▶</span><span>WATCH MANIFESTO<small>(1:20)</small></span></Link></div>
      </div>
      <div className="mw-hero-note">SAME MOON<br/>DIFFERENT<br/>PEOPLE.</div>
      <div className="mw-hero-sidecard"><Crown/><strong>WITNESS<br/>THE REAL.</strong><small>PLACES · PEOPLE<br/>STORIES · SIGNALS<br/>A BRIGHTER US.</small><span className="mw-moon-phases">◐ ◓ ◑ ◒ ●</span></div>
      <div className="mw-hero-sticker">A GLOBAL PLATFORM<br/>FOR REAL HUMAN STORIES.</div>
    </section>

    <section className="mw-section mw-stories" id="stories">
      <header className="mw-section-head"><div><span className="mw-number">01</span><h2>STORIES</h2><small>REAL PEOPLE. UNFILTERED WORLDS.</small></div><Link href="/workspace">→</Link></header>
      <div className="mw-story-grid">{stories.map((story, index) => <Link className={`mw-story-card mw-story-card--${story.tone}`} href="/workspace" key={story.id}><span className="mw-story-index">STORY / 0{index + 1}</span><span className="mw-story-silhouette" aria-hidden="true">{index % 2 ? "◉" : "◒"}</span><strong>{story.title}</strong><small><i/> {story.place}</small></Link>)}</div>
    </section>

    <div className="mw-mid-grid">
      <section className="mw-section mw-crew" id="crew"><header className="mw-section-head"><div><span className="mw-number">02</span><h2>CREW</h2><Crown/><small>A GLOBAL CREW OF CURIOUS HUMANS</small></div><Link href="/workspace">→</Link></header><div className="mw-crew-wall"><div className="mw-crew-person">◉<small>DIFFERENT<br/>PLACES</small></div><div className="mw-crew-person">◒<small>SAME<br/>CURIOSITY</small></div><div className="mw-crew-person">◉<small>PEOPLE<br/>MAKE SIGNAL</small></div></div><Link className="mw-button mw-button--paper" href="/workspace">MEET THE CREW <span>→</span></Link></section>
      <section className="mw-section mw-universe" id="universe"><header className="mw-section-head"><div><span className="mw-number">03</span><h2>UNIVERSE</h2><small>MORE THAN STORIES. A LIVING ARCHIVE.</small></div><Link href="/systems">→</Link></header><div className="mw-universe-map"><div className="mw-planet"/><span className="mw-orbit-label mw-orbit-label--one">● STORIES</span><span className="mw-orbit-label mw-orbit-label--two">● CREW</span><span className="mw-orbit-label mw-orbit-label--three">● SIGNAL</span><span className="mw-orbit-label mw-orbit-label--four">● ARCHIVE</span><Crown/></div><p>ONE PLATFORM.<br/>MANY ORBITS.<br/>A BRIGHTER TOMORROW.</p></section>
    </div>

    <div className="mw-lower-grid">
      <section className="mw-section mw-signal" id="signal"><header className="mw-section-head"><div><span className="mw-number">04</span><h2>SIGNAL</h2><small>IDEAS. VOICES. MOVEMENTS.</small></div><Link href="/workspace">→</Link></header><div className="mw-signal-board"><div className="mw-megaphone">◖)))<small>SMALL STORIES.<br/>BIG RIPPLES.</small></div><Link href="/workspace"><Badge>IDEA</Badge><strong>Open Call:<br/>What Does Home<br/>Look Like Now?</strong></Link><Link href="/workspace"><Badge tone="blue">CREW</Badge><strong>A Letter<br/>to My 20s</strong></Link><Link href="/workspace"><Badge tone="yellow">WORLD</Badge><strong>The Night<br/>We All Looked Up</strong></Link></div></section>
      <section className="mw-section mw-archive" id="archive"><header className="mw-section-head"><div><span className="mw-number">05</span><h2>ARCHIVE</h2><Crown/><small>FEATURED. COLLABS. REAL-WORLD IMPACT.</small></div><Link href="/workspace">→</Link></header><div className="mw-archive-grid"><Link href="/workspace"><span>FIELD NOTES · 2025</span><strong>THE MOONWITNESS<br/>STORY ARCHIVE</strong></Link><Link href="/workspace"><span>LIVE COLLABORATION</span><strong>DIFFERENT CITIES.<br/>SAME MOON.</strong></Link></div></section>
    </div>

    <section className="mw-join" id="manifesto"><div><Crown/><h2>THE SKY BELONGS<br/>TO ALL OF US.</h2><p>MORE STORIES. MORE PLACES.<br/>MORE PERSPECTIVES. A BRIGHTER WORLD.</p></div><div className="mw-join-moon" aria-hidden="true"/><div className="mw-join-actions"><Link href="/workspace" className="mw-button mw-button--blue">JOIN THE MOVEMENT <span>→</span></Link><Link href="/workspace" className="mw-button mw-button--yellow">JOIN THE CREW <span>→</span></Link><small>STAY IN THE LOOP · STORIES FROM EVERYWHERE.</small></div></section>
    <footer className="mw-footer"><MoonMark/><span>MOONWITNESS · DIFFERENT PEOPLE. SAME SKY.</span><Link href="/workspace">SHADOW COMMAND CENTER ↗</Link></footer>
  </div>;
}
