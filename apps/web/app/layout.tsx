import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeBootstrap } from "@empire/ui";
import { getWebLanguage, text } from "../lib/i18n";
import { PrimaryNavigation } from "../components/PrimaryNavigation";
import { MoonwitnessBrandLockup, IconText, PublicShell, ArrowUpRightIcon, ExternalLinkIcon } from "@empire/ui";
import "@empire/ui/ui.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getWebLanguage();
  const description = text(language,
    "Moonwitness: orang berbeda, langit yang sama. Cerita manusia dari berbagai tempat, ide, suara, dan gerakan yang menembus batas.",
    "Moonwitness: different people, same sky. Human stories from places around the world, ideas, voices, and movements beyond borders.");
  return {
    title: { default: "MOONWITNESS — Empire of the Light", template: "%s | MOONWITNESS" },
    description,
    icons: { icon: "/brand/icon.svg" },
    openGraph: { title: "MOONWITNESS • Empire of the Light", description, type: "website" },
    robots: { index: true, follow: true },
  };
}

export default async function CommandCenterLayout({ children }: { children: ReactNode }) {
  const language = await getWebLanguage();
  return <html lang={language} data-theme="dark" suppressHydrationWarning data-scroll-behavior="smooth"><head><ThemeBootstrap /></head><body>
    <PublicShell
      skipLabel={text(language,"Lewati ke konten utama","Skip to main content")}
      footerLabel={text(language,"Navigasi footer","Footer navigation")}
      brand={<Link className="brand" href="/" aria-label="Moonwitness home"><MoonwitnessBrandLockup /></Link>}
      navigation={<PrimaryNavigation language={language} />}
      action={<Link className="header-cta" href="/#crew"><IconText icon={<ArrowUpRightIcon />}>JOIN THE CREW</IconText></Link>}
      footerBrand={<MoonwitnessBrandLockup descriptor={text(language,"Orang berbeda. Langit yang sama.","Different people. Same sky.")} />}
      footerContent={<><span>GENESIS v5.0 · {text(language,"HUB RISET & OPERASI","RESEARCH & OPERATIONS HUB")}</span><span>{text(language,"Diawasi manusia · Sumber jelas","Human-governed · Source-grounded")}</span><Link href="/#manifesto">A-L-L-A-H</Link><Link href="/#universe">{text(language,"Ekosistem","Ecosystem")}</Link><Link href="/systems">{text(language,"Atlas sistem","System atlas")}</Link><Link href="/roadmap">{text(language,"Peta jalan & kesiapan","Roadmap & readiness")}</Link><Link href="/#archive">100CENTER</Link><a href="https://github.com/bjo163/A-L-L-A-H" target="_blank" rel="noopener noreferrer"><IconText icon={<ExternalLinkIcon />}>GitHub</IconText></a></>}
    >{children}</PublicShell>
  </body></html>;
}
