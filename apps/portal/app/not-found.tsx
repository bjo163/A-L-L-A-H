import Link from "next/link";
import { buttonClassName } from "@empire/ui";
import { getPortalLanguage } from "../lib/i18n";
export default async function NotFound(){const en=(await getPortalLanguage())==="en";return <div className="container not-found"><p className="eyebrow">404 / {en?"PAGE NOT FOUND":"HALAMAN TAK DITEMUKAN"}</p><h1>{en?"THIS PATH DOES NOT EXIST.":"JALUR INI BELUM ADA."}</h1><p>{en?"Return to the portal and choose another section to explore.":"Kembali ke portal dan pilih bagian lain untuk dijelajahi."}</p><Link className={buttonClassName("primary", "btn")} href="/">{en?"Back to home ↗":"Kembali ke beranda ↗"}</Link></div>}
