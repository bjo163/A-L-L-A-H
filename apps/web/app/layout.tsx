import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeBootstrap } from "@empire/ui";
import { getWebLanguage, text } from "../lib/i18n";
import { PrimaryNavigation } from "../components/PrimaryNavigation";
import { BrandLockup, IconText, PublicShell, ArrowUpRightIcon, ExternalLinkIcon } from "@empire/ui";
import "@empire/ui/ui.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getWebLanguage();
  const description = text(language,
    "Kenali A-L-L-A-H dan ARSY (Agent Reality System Yard & Orchestration): rancangan agency dan orkestrasi agen, alat, lingkungan eksekusi, serta sistem kerja dengan AI sebagai kemampuan dasar.",
    "Explore A-L-L-A-H and ARSY (Agent Reality System Yard & Orchestration): a proposed agency and orchestration system for agents, tools, runtime environments, and workflows, with AI as a foundational capability.");
  return {
    title: { default: "A-L-L-A-H — Empire of the Light", template: "%s | A-L-L-A-H" },
    description,
    icons: { icon: "/brand/icon.svg" },
    openGraph: { title: "A-L-L-A-H • Empire of the Light", description, type: "website" },
    robots: { index: true, follow: true },
  };
}

export default async function CommandCenterLayout({ children }: { children: ReactNode }) {
  const language = await getWebLanguage();
  return <html lang={language} data-theme="dark" suppressHydrationWarning data-scroll-behavior="smooth"><head><ThemeBootstrap /></head><body>
    <PublicShell
      skipLabel={text(language,"Lewati ke konten utama","Skip to main content")}
      footerLabel={text(language,"Navigasi footer","Footer navigation")}
      brand={<Link className="brand" href="/" aria-label={text(language,"Beranda A-L-L-A-H","A-L-L-A-H home")}><BrandLockup name="A-L-L-A-H" descriptor={text(language,"HUB TERPADU","UNIFIED HUB")} /></Link>}
      navigation={<PrimaryNavigation language={language} />}
      action={<Link className="header-cta" href="/systems"><IconText icon={<ArrowUpRightIcon />}>{text(language,"Jelajahi sistem","Explore systems")}</IconText></Link>}
      footerBrand={<BrandLockup size="compact" tone="subtle" name="A-L-L-A-H · EMPIRE OF THE LIGHT" descriptor={text(language,"Belajar dengan terang. Bertindak dengan bukti.","Learn with clarity. Act with evidence.")} />}
      footerContent={<><span>GENESIS v5.0 · {text(language,"HUB RISET & OPERASI","RESEARCH & OPERATIONS HUB")}</span><span>{text(language,"Diawasi manusia · Sumber jelas","Human-governed · Source-grounded")}</span><Link href="/#identitas">A-L-L-A-H</Link><Link href="/#ekosistem">{text(language,"Ekosistem","Ecosystem")}</Link><Link href="/systems">{text(language,"Atlas sistem","System atlas")}</Link><Link href="/roadmap">{text(language,"Peta jalan & kesiapan","Roadmap & readiness")}</Link><Link href="/">100CENTER</Link><a href="https://github.com/bjo163/empire-of-the-light" target="_blank" rel="noopener noreferrer"><IconText icon={<ExternalLinkIcon />}>GitHub</IconText></a></>}
    >{children}</PublicShell>
  </body></html>;
}
