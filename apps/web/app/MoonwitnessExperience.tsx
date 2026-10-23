import Link from "next/link";
import type { WebLanguage } from "../lib/i18n";
import type { ReactNode } from "react";
import { MoonwitnessCrown as Crown } from "@empire/ui";

const copy = {
  en: {
    heroArt: "A hooded witness looking over a city toward a bright blue moon",
    heroKicker: <>REAL PEOPLE. UNFILTERED WORLDS.<br />A BRIGHTER US.</>,
    follow: "FOLLOW THE SIGNAL",
    tagline: <>DIFFERENT PEOPLE. SAME SKY.<br /><b>STORIES BEYOND BORDERS.</b></>,
    explore: "EXPLORE STORIES",
    watch: "WATCH MANIFESTO",
    heroNote: <>SAME MOON<br />DIFFERENT<br />PEOPLE.</>,
    witness: <>WITNESS<br />THE REAL.</>,
    witnessDetails: <>PLACES · PEOPLE<br />STORIES · SIGNALS<br />A BRIGHTER US.</>,
    sticker: <>A GLOBAL PLATFORM<br />FOR REAL HUMAN STORIES.</>,
    stories: "STORIES",
    realPeople: "REAL PEOPLE. UNFILTERED WORLDS.",
    storyIndex: "STORY",
    crew: "CREW",
    crewSubtitle: "A GLOBAL CREW OF CURIOUS HUMANS",
    places: <>DIFFERENT<br />PLACES</>,
    curiosity: <>SAME<br />CURIOSITY</>,
    peopleSignal: <>PEOPLE<br />MAKE THE SIGNAL.</>,
    meetCrew: "MEET THE CREW",
    universe: "UNIVERSE",
    universeSubtitle: "MORE THAN STORIES. A LIVING ARCHIVE.",
    orbitStories: "STORIES",
    orbitCrew: "CREW",
    orbitSignal: "SIGNAL",
    orbitArchive: "ARCHIVE",
    universeStatement: <>ONE PLATFORM.<br />MANY ORBITS.<br />A BRIGHTER TOMORROW.</>,
    signal: "SIGNAL",
    signalSubtitle: "IDEAS. VOICES. MOVEMENTS.",
    ripples: <>SMALL STORIES.<br />BIG RIPPLES.</>,
    idea: "IDEA",
    crewBadge: "CREW",
    world: "WORLD",
    homePrompt: <>Open Call:<br />What Does Home<br />Look Like Now?</>,
    letter: <>A Letter<br />to My 20s</>,
    night: <>The Night<br />We All Looked Up</>,
    archive: "ARCHIVE",
    archiveSubtitle: "FEATURED. COLLABS. REAL-WORLD IMPACT.",
    fieldNotes: "FIELD NOTES · 2025",
    storyArchive: <>THE MOONWITNESS<br />STORY ARCHIVE</>,
    liveCollaboration: "LIVE COLLABORATION",
    cities: <>DIFFERENT CITIES.<br />SAME MOON.</>,
    sky: <>THE SKY BELONGS<br />TO ALL OF US.</>,
    joinPrompt: <>MORE STORIES. MORE PLACES.<br />MORE PERSPECTIVES. A BRIGHTER WORLD.</>,
    joinMovement: "JOIN THE MOVEMENT",
    joinCrew: "JOIN THE CREW",
    stayLoop: "STAY IN THE LOOP · STORIES FROM EVERYWHERE.",
    footer: "MOONWITNESS · DIFFERENT PEOPLE. SAME SKY.",
    shadow: "SHADOW COMMAND CENTER",
    shadowAria: "Open SHADOW Command Center",
    crewImage: "A crew member exploring a night market",
    signalImage: "A crew gathered under the same moon",
    cityImage: "Witnesses looking out over the city",
    storiesImage: [
      "A SMALL TOWN STILL LOOKS UP",
      "SAME MOON, DIFFERENT DREAMS",
      "FAR BUT UNDER THE SAME MOON.",
      "STILL HERE. STILL HUMAN.",
    ],
  },
  id: {
    heroArt: "Saksi berkerudung memandang kota ke arah bulan biru yang terang",
    heroKicker: <>ORANG NYATA. DUNIA TANPA FILTER.<br />KITA YANG LEBIH BAIK.</>,
    follow: "IKUTI SINYAL",
    tagline: <>ORANG BERBEDA. LANGIT YANG SAMA.<br /><b>KISAH MELINTASI BATAS.</b></>,
    explore: "JELAJAHI KISAH",
    watch: "TONTON MANIFESTO",
    heroNote: <>BULAN YANG SAMA<br />ORANG BERBEDA<br />SATU LANGIT.</>,
    witness: <>Saksikan<br />yang nyata.</>,
    witnessDetails: <>TEMPAT · ORANG<br />KISAH · SINYAL<br />KITA YANG LEBIH BAIK.</>,
    sticker: <>PLATFORM GLOBAL<br />UNTUK KISAH MANUSIA NYATA.</>,
    stories: "KISAH",
    realPeople: "ORANG NYATA. DUNIA TANPA FILTER.",
    storyIndex: "KISAH",
    crew: "KRU",
    crewSubtitle: "KRU GLOBAL YANG PENUH RASA INGIN TAHU",
    places: <>TEMPAT<br />BERBEDA</>,
    curiosity: <>RASA INGIN TAHU<br />YANG SAMA</>,
    peopleSignal: <>ORANG-ORANG<br />MENYALAKAN SINYAL.</>,
    meetCrew: "KENALI KRU",
    universe: "SEMESTA",
    universeSubtitle: "LEBIH DARI KISAH. ARSIP YANG TERUS HIDUP.",
    orbitStories: "KISAH",
    orbitCrew: "KRU",
    orbitSignal: "SINYAL",
    orbitArchive: "ARSIP",
    universeStatement: <>SATU PLATFORM.<br />BANYAK ORBIT.<br />MASA DEPAN LEBIH CERAH.</>,
    signal: "SINYAL",
    signalSubtitle: "IDE. SUARA. GERAKAN.",
    ripples: <>KISAH KECIL.<br />DAMPAK BESAR.</>,
    idea: "IDE",
    crewBadge: "KRU",
    world: "DUNIA",
    homePrompt: <>Ajakan Terbuka:<br />Seperti Apa Arti Rumah<br />Hari Ini?</>,
    letter: <>Surat<br />untuk Diriku di Usia 20-an</>,
    night: <>Malam Saat<br />Kita Semua Menatap Langit</>,
    archive: "ARSIP",
    archiveSubtitle: "SOROTAN. KOLABORASI. DAMPAK DI DUNIA NYATA.",
    fieldNotes: "CATATAN LAPANGAN · 2025",
    storyArchive: <>ARSIP KISAH<br />MOONWITNESS</>,
    liveCollaboration: "KOLABORASI LANGSUNG",
    cities: <>KOTA BERBEDA.<br />BULAN YANG SAMA.</>,
    sky: <>LANGIT INI MILIK<br />KITA SEMUA.</>,
    joinPrompt: <>LEBIH BANYAK KISAH. LEBIH BANYAK TEMPAT.<br />LEBIH BANYAK SUDUT PANDANG. DUNIA LEBIH CERAH.</>,
    joinMovement: "IKUTI GERAKAN INI",
    joinCrew: "GABUNG DENGAN KRU",
    stayLoop: "TETAP TERHUBUNG · KISAH DARI MANA SAJA.",
    footer: "MOONWITNESS · ORANG BERBEDA. LANGIT YANG SAMA.",
    shadow: "PUSAT KOMANDO SHADOW",
    shadowAria: "Buka Pusat Komando SHADOW",
    crewImage: "Anggota kru menjelajahi pasar malam",
    signalImage: "Kru berkumpul di bawah bulan yang sama",
    cityImage: "Para saksi memandang kota",
    storiesImage: [
      "KOTA KECIL INI MASIH MENATAP LANGIT",
      "BULAN YANG SAMA, MIMPI YANG BERBEDA",
      "JAUH, NAMUN DI BAWAH BULAN YANG SAMA.",
      "MASIH DI SINI. MASIH MANUSIA.",
    ],
  },
} as const;

const storyPlaces = ["JAKARTA, IDN", "SEOUL, KR", "LISBON, PT", "MANILA, PH"];
const storyTones = ["pink", "blue", "violet", "yellow"];

function MoonMark() {
  return <span className="mw-mark" aria-hidden="true"><span>M</span><i>✦</i></span>;
}

function Badge({ children, tone = "pink" }: { children: ReactNode; tone?: string }) {
  return <span className={`mw-badge mw-badge--${tone}`}>{children}</span>;
}

export function MoonwitnessExperience({ language }: { language: WebLanguage }) {
  const t = copy[language];
  return <div className="mw-site">
    <section className="mw-hero" aria-labelledby="mw-title">
      <div className="mw-hero-art" role="img" aria-label={t.heroArt} />
      <div className="mw-hero-splatter" aria-hidden="true">✳</div>
      <div className="mw-hero-copy">
        <p className="mw-kicker">{t.heroKicker}</p>
        <h1 id="mw-title"><span>MOON</span><em>WITNESS</em></h1>
        <Link href="#stories" className="mw-yellow-ribbon">{t.follow} <span>↗</span></Link>
        <p className="mw-hero-tagline">{t.tagline}</p>
        <div className="mw-hero-actions"><Link href="#stories" className="mw-button mw-button--paper">{t.explore} <span>→</span></Link><Link href="#manifesto" className="mw-watch"><span className="mw-play">▶</span><span>{t.watch}<small>(1:20)</small></span></Link></div>
      </div>
      <div className="mw-hero-note">{t.heroNote}</div>
      <div className="mw-hero-sidecard"><Crown/><strong>{t.witness}</strong><small>{t.witnessDetails}</small><span className="mw-moon-phases" aria-hidden="true">◐ ◓ ◑ ◒ ●</span></div>
      <div className="mw-hero-sticker">{t.sticker}</div>
    </section>

    <section className="mw-section mw-stories" id="stories">
      <header className="mw-section-head"><div><span className="mw-number">01</span><h2>{t.stories}</h2><small>{t.realPeople}</small></div><Link href="/stories" aria-label={language === "id" ? "Lihat semua kisah" : "View all stories"}>→</Link></header>
      <div className="mw-story-grid">{storyPlaces.map((place, index) => <Link className={`mw-story-card mw-story-card--${storyTones[index]}`} href="/stories" key={place}><span className="mw-story-index">{t.storyIndex} / 0{index + 1}</span><span className="mw-story-image" aria-hidden="true"/><strong>{t.storiesImage[index]}</strong><small><i/> {place}</small></Link>)}</div>
    </section>

    <div className="mw-mid-grid">
      <section className="mw-section mw-crew" id="crew"><header className="mw-section-head"><div><span className="mw-number">02</span><h2>{t.crew}</h2><Crown/><small>{t.crewSubtitle}</small></div><Link href="/#crew" aria-label={language === "id" ? "Bagian kru" : "Crew section"}>→</Link></header><div className="mw-crew-wall"><div className="mw-crew-person mw-crew-person--market" role="img" aria-label={t.crewImage}><small>{t.places}</small></div><div className="mw-crew-person mw-crew-person--signal" role="img" aria-label={t.signalImage}><small>{t.curiosity}</small></div><div className="mw-crew-person mw-crew-person--city" role="img" aria-label={t.cityImage}><small>{t.peopleSignal}</small></div></div><Link className="mw-button mw-button--paper" href="/#crew">{t.meetCrew} <span>→</span></Link></section>
      <section className="mw-section mw-universe" id="universe"><header className="mw-section-head"><div><span className="mw-number">03</span><h2>{t.universe}</h2><small>{t.universeSubtitle}</small></div><Link href="/systems" aria-label={language === "id" ? "Jelajahi sistem" : "Explore systems"}>→</Link></header><div className="mw-universe-map"><div className="mw-planet"/><span className="mw-orbit-label mw-orbit-label--one">● {t.orbitStories}</span><span className="mw-orbit-label mw-orbit-label--two">● {t.orbitCrew}</span><span className="mw-orbit-label mw-orbit-label--three">● {t.orbitSignal}</span><span className="mw-orbit-label mw-orbit-label--four">● {t.orbitArchive}</span><Crown/></div><p>{t.universeStatement}</p></section>
    </div>

    <div className="mw-lower-grid">
      <section className="mw-section mw-signal" id="signal"><header className="mw-section-head"><div><span className="mw-number">04</span><h2>{t.signal}</h2><small>{t.signalSubtitle}</small></div><Link href="/#signal" aria-label={language === "id" ? "Bagian sinyal" : "Signal section"}>→</Link></header><div className="mw-signal-board"><div className="mw-megaphone">◖)))<small>{t.ripples}</small></div><Link href="/#signal"><Badge>{t.idea}</Badge><strong>{t.homePrompt}</strong></Link><Link href="/#signal"><Badge tone="blue">{t.crewBadge}</Badge><strong>{t.letter}</strong></Link><Link href="/#signal"><Badge tone="yellow">{t.world}</Badge><strong>{t.night}</strong></Link></div></section>
      <section className="mw-section mw-archive" id="archive"><header className="mw-section-head"><div><span className="mw-number">05</span><h2>{t.archive}</h2><Crown/><small>{t.archiveSubtitle}</small></div><Link href="/#archive" aria-label={language === "id" ? "Bagian arsip" : "Archive section"}>→</Link></header><div className="mw-archive-grid"><Link href="/#archive"><span>{t.fieldNotes}</span><strong>{t.storyArchive}</strong></Link><Link href="/#archive"><span>{t.liveCollaboration}</span><strong>{t.cities}</strong></Link></div></section>
    </div>

    <section className="mw-join" id="manifesto"><div><Crown/><h2>{t.sky}</h2><p>{t.joinPrompt}</p></div><div className="mw-join-moon" aria-hidden="true"/><div className="mw-join-actions"><Link href="/#manifesto" className="mw-button mw-button--blue">{t.joinMovement} <span>→</span></Link><Link href="/#crew" className="mw-button mw-button--yellow">{t.joinCrew} <span>→</span></Link><small>{t.stayLoop}</small></div></section>
    <footer className="mw-footer"><MoonMark/><span>{t.footer}</span><Link href="/workspace" aria-label={t.shadowAria}>{language === "id" ? t.shadow : "SHADOW COMMAND CENTER"} ↗</Link></footer>
  </div>;
}
