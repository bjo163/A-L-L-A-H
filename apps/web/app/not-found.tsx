import Link from "next/link";
import { buttonClassName, Container, IconText, ArrowUpRightIcon } from "@empire/ui";
import { getWebLanguage } from "../lib/i18n";
export default async function NotFound(){const en=(await getWebLanguage())==="en";return <Container className="not-found"><p className="eyebrow">404 / {en?"PAGE NOT FOUND":"HALAMAN TAK DITEMUKAN"}</p><h1>{en?"THIS PATH DOES NOT EXIST.":"JALUR INI BELUM ADA."}</h1><p>{en?"Return to the website and choose another section to explore.":"Kembali ke portal dan pilih bagian lain untuk dijelajahi."}</p><Link className={buttonClassName("primary", "eol-button--lg")} href="/"><IconText icon={<ArrowUpRightIcon />}>{en?"Back to home":"Kembali ke beranda"}</IconText></Link></Container>}
