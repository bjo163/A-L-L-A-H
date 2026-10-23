import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, Container } from "@empire/ui";
import { getWebLanguage } from "../../lib/i18n";
import { PageCrosslinks, PageIntro } from "../../components/PageChrome";

export default async function StoriesPage() {
  const en = (await getWebLanguage()) === "en";

  return <Container>
    <PageIntro
      homeLabel={en ? "HOME" : "BERANDA"}
      section={en ? "PUBLIC STORIES" : "CERITA PUBLIK"}
      chapter="MOONWITNESS"
      eyebrow={en ? "THE STORY ARCHIVE" : "ARSIP CERITA"}
      title={en ? <>STORIES ARE <em>ON THE WAY.</em></> : <>CERITA AKAN <em>HADIR.</em></>}
      description={en
        ? "This public archive is not available yet. No published stories are being presented here; visit the public Moonwitness home page for current project information."
        : "Arsip publik ini belum tersedia. Belum ada cerita terbit yang ditampilkan di sini; kunjungi beranda Moonwitness untuk informasi proyek saat ini."}
      sfx={en ? "SOON" : "NANTI"}
      links={[
        { href: "/", label: en ? "Moonwitness home" : "Beranda Moonwitness", icon: <ArrowLeftIcon /> },
        { href: "/systems", label: en ? "Explore the system atlas" : "Jelajahi atlas sistem", icon: <ArrowRightIcon /> },
      ]}
    />
    <PageCrosslinks label={en ? "Related pages" : "Halaman terkait"} links={[
      { href: "/", label: en ? "Back to Moonwitness" : "Kembali ke Moonwitness", icon: <ArrowLeftIcon />, iconPosition: "start" },
      { href: "/workspace", label: en ? "Private SHADOW workspace" : "Ruang kerja privat SHADOW", icon: <ArrowRightIcon /> },
    ]}/>
    <p className="source-line">{en ? "The SHADOW workspace requires an operator account." : "Ruang kerja SHADOW memerlukan akun operator."} <Link href="/workspace">{en ? "Operator sign in" : "Masuk operator"}</Link></p>
  </Container>;
}
