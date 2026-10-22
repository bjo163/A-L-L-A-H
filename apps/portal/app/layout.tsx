import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PrimaryNavigation } from "../components/PrimaryNavigation";
import { getPortalLanguage, text } from "../lib/i18n";
import "@empire/ui/styles.css";
import "@empire/ui/manga-theme.css";
import "./globals.css";
import "./manga-theme.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPortalLanguage();
  const description = text(language,
    "Kenali A-L-L-A-H dan ARSY (Agent Reality System Yard & Orchestration): rancangan agency dan orkestrasi agen, alat, lingkungan eksekusi, serta sistem kerja dengan AI sebagai kemampuan dasar.",
    "Explore A-L-L-A-H and ARSY (Agent Reality System Yard & Orchestration): a proposed agency and orchestration system for agents, tools, runtime environments, and workflows, with AI as a foundational capability.");
  return {
    title: { default: "A-L-L-A-H — Portal Empire of the Light", template: "%s | A-L-L-A-H" },
    description,
    openGraph: { title: "A-L-L-A-H • Empire of the Light", description, type: "website" },
    robots: { index: true, follow: true }
  };
}

export default async function RootLayout({children}:{children:ReactNode}) {
  const language = await getPortalLanguage();
  return <html lang={language} suppressHydrationWarning data-theme="dark" data-scroll-behavior="smooth"><head><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('eol-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}"}} /></head><body>
    <div className="site-shell">
      <a className="skip-link" href="#main-content">{text(language,"Lewati ke konten utama","Skip to main content")}</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label={text(language,"Beranda A-L-L-A-H","A-L-L-A-H home")}>
          <span className="brand-sigil" aria-hidden="true"><span className="sigil-core"/></span>
          <span className="brand-name">A-L-L-A-H<span>EMPIRE OF THE LIGHT</span></span>
        </Link>
        <PrimaryNavigation language={language} />
        <Link className="header-cta" href="/systems">{text(language,"Jelajahi sistem","Explore systems")} <span aria-hidden="true">↗</span></Link>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-sigil small" aria-hidden="true"><span className="sigil-core"/></span><div><b>A-L-L-A-H · EMPIRE OF THE LIGHT</b><p>{text(language,"Belajar dengan terang. Bertindak dengan bukti.","Learn with clarity. Act with evidence.")}</p></div></div>
        <nav className="footer-right" aria-label={text(language,"Navigasi footer","Footer navigation")}><span>GENESIS v5.0 · {text(language,"PORTAL RISET PUBLIK","PUBLIC RESEARCH PORTAL")}</span><span>{text(language,"Diawasi manusia · Sumber jelas","Human-governed · Source-grounded")}</span><Link href="/#identitas">A-L-L-A-H</Link><Link href="/#ekosistem">{text(language,"Ekosistem","Ecosystem")}</Link><Link href="/systems">{text(language,"Atlas sistem","System atlas")}</Link><Link href="/roadmap">{text(language,"Peta jalan & kesiapan","Roadmap & readiness")}</Link><a href="https://github.com/bjo163/empire-of-the-light" target="_blank" rel="noopener noreferrer">GitHub ↗</a></nav>
      </footer>
    </div>
  </body></html>;
}
