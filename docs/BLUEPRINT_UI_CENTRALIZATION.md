# Blueprint sentralisasi UI — Empire of the Light

Versi 1.0 · 22 Oktober 2026 · Status: rencana implementasi, belum merupakan hasil migrasi.

Pemilik acuan desain: `packages/ui` (`@empire/ui`). Konsumen: Portal, 100CENTER / Command Center, dan katalog UI. Dokumen ini menjadi acuan aktif untuk sentralisasi desain, identitas visual, aset vektor, dan migrasi konsumen. [Blueprint UI sebelumnya](BLUEPRINT_UI.md) tetap menyimpan roadmap produk dan bukti historis. Bila aturan kepemilikan visual berbeda, gunakan dokumen ini untuk pekerjaan baru.

## 1. Hasil yang ingin dicapai

Satu keluarga visual yang khas, matang, mudah dibaca, dan mudah dikembangkan. Semua keputusan warna, tipografi, spacing, bentuk, ikon, logo, surface, state interaksi, gerakan, dan pola presentasi dimiliki `@empire/ui`. Portal dan Command Center merakit pengalaman menggunakan API visual tersebut; mengubah fondasi sekali memperbarui seluruh konsumen secara terukur.

Konsistensi berarti konsep yang sama memiliki representasi dan perilaku yang sama. Portal boleh memiliki komposisi editorial yang lapang dan Command Center memiliki komposisi operasi yang padat. Kedua komposisi itu disediakan sebagai pola resmi dalam package. Perbedaan harus memiliki nama, tujuan, dan contoh; tidak muncul sebagai override tersembunyi.

Target penerimaan akhir:

- Semua route Portal, delapan view Command Center, login, pemulihan sesi, state sistem, dan katalog memakai fondasi serta komponen resmi.
- Tidak ada definisi palet, button, field, badge, panel, logo, atau ikon produk paralel di aplikasi.
- Semua CSS presentasi produk berada dalam package dengan kepemilikan jelas; CSS konsumen hanya entry import dan penempatan canvas vendor yang benar-benar memerlukan integrasi runtime.
- Aplikasi tetap memiliki routing, data, copy produk, permission, sesi, API, validasi bisnis, dan workflow. Package UI menerima props dan slot presentasi.
- Logo dan ikon punya sumber SVG yang dapat diedit, ukuran optik, varian warna, aturan penggunaan, dan manifest lisensi.
- Kualitas dibuktikan melalui matriks halaman × tema × viewport × state. Typecheck saja tidak menutup migrasi.
- Tidak ada klaim “seluruhnya konsisten” sebelum bukti untuk semua permukaan wajib tersedia.

## 2. Baseline, batas audit, dan koreksi

Baseline bersumber dari kode workspace pada 22 Oktober 2026. Banyak file sedang berubah; snapshot sebelum migrasi harus memakai revisi/arsip yang dapat dilacak. Audit sebelumnya membaca implementasi dan menjalankan typecheck tiga workspace; belum merupakan pengujian visual lengkap seluruh alur terautentikasi.

| Area | Bukti kode saat perencanaan | Konsekuensi |
| --- | --- | --- |
| Fondasi | `packages/ui/src/tokens.css`, `styles.css`, `manga-theme.css` | Tema dasar dan manga mengatur beberapa alias yang sama; perlu kontrak berlapis yang eksplisit |
| Primitive | Button, Panel, Badge, Notice, fields, Tabs, Switch, dialog, state | Sudah ada; audit dan sempurnakan API sebelum membuat pengganti |
| Panel | `.eol-panel` sudah memiliki border, background, foreground, radius, shadow | Koreksi audit sebelumnya: surface dasar tidak bergantung pada prop `manga`; masalahnya adalah variasi dan override |
| Portal | Tiga route, 404, tiga loading entry, Explorer, navigation, page chrome | Layout dan visual masih tersebar di CSS Portal dan pola package |
| CSS Portal | `globals.css` dan `manga-theme.css` lokal | Ada pengulangan aturan serta beberapa generasi tampilan; konsolidasi perlu membaca cascade final |
| Command Center | `App.tsx`, `WorldMonitorView.tsx`, `WorldGlobeMap.tsx`, `style.css` | Shell, tabel, metrik, form, state, dan peta perlu pola presentasi bersama |
| Identitas | Brand sigil CSS serta simbol/emoji di beberapa permukaan | Belum ada keluarga SVG resmi yang terinventarisasi; buat manifest sebelum menetapkan duplikasi aset |
| Katalog | Vite catalog dengan contoh primitive dan beberapa pola | Klaim cakupan semua ekspor harus diperiksa ulang; tambah telemetry, brand, icons, dan fixture halaman |
| Dokumentasi lama | Memuat deskripsi awal, rasio kontras, dan bukti perubahan | Angka kontras lama tidak otomatis berlaku untuk tema terbaru; hitung ulang saat token dibekukan |

Jangan memakai jumlah baris CSS sebagai ukuran kualitas: banyak aturan saat ini ditulis dalam satu baris. Gunakan inventaris selector, deklarasi, pemakaian, duplikasi bermakna, dan hasil render.

## 3. Keputusan arsitektur target

### 3.1 Kepemilikan dan batas dependensi

| Isi | Lokasi pemilik | Kontrak |
| --- | --- | --- |
| Palette, semantic tokens, component tokens | `packages/ui/src/tokens/` | Literal visual didefinisikan di sini; komponen memakai token semantik |
| Light/dark dan profil presentasi | `packages/ui/src/themes/` | Tema mengubah warna; profil mengatur kepadatan/ornamen tanpa mengubah makna status |
| Reset dan styles komponen | `packages/ui/src/styles/` | Satu entry resmi; namespace `eol-`; dampak reset didokumentasikan |
| Logo, wordmark, favicon, ikon, motif SVG | `packages/ui/src/brand/`, `icons/`, `assets/` | Satu sumber; keluaran publik dihasilkan dari sumber tersebut |
| Button, forms, surfaces, feedback | `packages/ui/src/primitives/` | Native semantics, typed variants, state dan aksesibilitas bersama |
| Navigasi, tabel, metrics, daftar/detail | `packages/ui/src/patterns/` | Data presentasi, slot, callback; bebas API bisnis dan router |
| Komposisi editorial/operasional | `packages/ui/src/layouts/` | `PublicShell`, `WorkspaceShell`, `PageLayout`, grid dan reading width |
| Adapter visual MapLibre | `packages/ui/src/adapters/` | Styles kontrol, legenda dan popup; diimpor hanya konsumen peta |
| Data, bahasa produk, auth, permission, workflow | `apps/*` | Memetakan model domain ke props UI; tidak menambah desain alternatif |
| Inisialisasi map/canvas dan lifecycle vendor | Command Center | Mengatur runtime, bounds, event dan data layer; palet/style menerima konfigurasi package |

Tidak memindahkan `App.tsx` atau seluruh halaman bisnis ke package untuk memenuhi angka sentralisasi. Yang diekstrak adalah anatomi visual dan interaksi generik. Satu komponen domain seperti ResearchCard boleh tetap di app bila seluruh presentasinya disusun dari primitive/pattern package dan tanpa CSS desain tersendiri.

### 3.2 Struktur target yang tumbuh bersama implementasi

```text
packages/ui/
  src/
    index.ts                  # API publik statis dan server-compatible
    client.ts                 # interaksi yang membutuhkan client boundary
    styles.css                # satu entry fondasi/komponen
    tokens/                   # palette, semantic, typography, spacing, motion
    themes/                   # light, dark, profiles
    brand/                    # LogoMark, BrandLockup, registry
    icons/                    # Icon, SVG definitions, explicit exports
    assets/                   # editable vector masters, derived assets manifest
    primitives/               # controls, text, surfaces, feedback
    patterns/                 # navigation, data, forms, content, map presentation
    layouts/                  # public/editorial/workspace composition
    adapters/                 # opt-in vendor presentation
  catalog/                    # primitives, patterns, assets, screen fixtures
  licenses/                   # font/icon/asset licenses and provenance
```

Nama path dan API di atas adalah target, bukan klaim ekspor yang sudah tersedia. Buat folder saat ada implementasi. Evaluasi entry server/client lewat build Next yang nyata; jangan memasang `use client` pada seluruh barrel sehingga halaman statis ikut menjadi client tree.

### 3.3 Kontrak CSS dan variasi

Urutan konsep: reset → token → tema → primitive → pattern → profil/density → adapter vendor. Jika memakai cascade layers, semua stylesheet milik produk harus mengikuti strategi yang sama: CSS unlayered lama dapat mengalahkan layer baru. Migrasikan satu permukaan utuh dan cek computed style sebelum mencampur keduanya.

Variasi resmi dirancang melalui props: `variant`, `tone`, `size`, `density`, `emphasis`, dan `decoration` hanya bila dibutuhkan. Hindari kombinasi props yang tak bermakna. Tone selalu semantik; profil manga tidak boleh membuat badge error tampak sebagai sukses.

`className` menjadi jalur kompatibilitas sementara selama migrasi dan tidak dianggap izin menimpa internal komponen. Semua pemakaian sementara memiliki tiket, pemilik, dan kondisi penghapusan. Data visual dinamis seperti koordinat, lebar progress, tinggi canvas, atau warna layer peta melalui token/props tervalidasi tetap dibolehkan.

## 4. Arah visual: Empire Ink

Nama kerja arah visual: **Empire Ink**. Identitas dibangun dari tinta tegas, ruang yang tenang, tipografi geometris, aksen cahaya, dan motif orbit yang sederhana. Warna pink, lime, cyan, serta violet yang ada menjadi kandidat brand, bukan semuanya menjadi warna utama setiap panel. Final palet dipilih setelah eksplorasi dan pemeriksaan pasangan warna.

| Elemen | Prinsip | Implementasi target |
| --- | --- | --- |
| Hierarki | Satu fokus utama dalam setiap section | H1 jelas, ringkasan singkat, aksi utama, informasi sekunder |
| Surface | Canvas tenang; panel penting lebih kuat | Default, inset, raised, selected, emphasis memakai token terpisah |
| Aksen | Satu aksen aksi dominan per konteks | Dekorasi memakai brand tokens; status memakai status tokens |
| Tipografi | Body terbaca, mono untuk kode/metrik | Body awal 16px editorial dan 14px operasional; metadata umumnya ≥12px sebagai target produk |
| Tinta | Garis dan bayangan terkontrol | Border dan offset shadow konsisten; tidak semua elemen harus terlihat seperti kartu |
| Manga | Memperkuat brand pada titik tertentu | Hero/illustration boleh ekspresif; table/form/dialog tetap tenang |
| Gerak | Menjelaskan perubahan atau memberi feedback | Tidak ada gerak dekoratif terus-menerus dekat pekerjaan baca intensif |
| Ikon | Geometri, stroke, dan skala optik seragam | SVG resmi; emoji tidak menjadi ikon navigasi utama |
| Ruang | Ritme terlihat pada setiap halaman | Token spacing, section rhythm, reading width dan density |

Tema terang dan gelap sama-sama first-class. Density `comfortable` dan `compact` tidak mengubah makna komponen. Ukuran 12px di atas adalah target desain produk, bukan klaim ambang kepatuhan universal. Compact mengurangi spacing terlebih dahulu; keterbacaan dan area sentuh tetap ditinjau.

Target ornamentasi untuk validasi desain: maksimal satu ilustrasi/hero ekspresif per view operasi; SFX dekoratif tidak muncul dalam error kritis, form validasi, ataupun konfirmasi aksi. Portal boleh lebih ekspresif, dengan pola hero dan section yang tetap mengikuti sistem.

## 5. Sistem logo, ikon, dan aset vektor

### 5.1 Keluarga brand

| Aset | Kegunaan | Bentuk keluaran |
| --- | --- | --- |
| Master mark Empire of the Light | Identitas induk | SVG geometris, monochrome dan brand |
| Lockup A-L-L-A-H | Header Portal dan materi editorial | Horizontal, stacked, compact |
| Lockup 100CENTER | Login, sidebar, workspace | Mark + nama produk, turunan keluarga induk |
| Mark kecil | Favicon, collapsed navigation | Versi optik sederhana 16/24/32px |
| Domain symbols | ARSY, HELIOGRID, Q-REALM, FORGE, COSMOS, ZIIL | Satu keluarga bentuk; tidak membuat enam sistem logo berbeda |
| Illustration motifs | Hero, empty state, loader | Orbit, ray, grid, panel, flow; komposisi reusable |

Konsep awal yang perlu dibandingkan: aperture cahaya, orbit dengan inti, dan monogram geometris. Setiap konsep disajikan di header Portal, sidebar, login, favicon, latar terang/gelap, monochrome, dan ukuran kecil. Skor pemilihan: keterbacaan kecil 25%, kesatuan keluarga 20%, kekhasan 20%, adaptasi media 15%, kebersihan SVG 10%, dan kesesuaian makna 10%. Bobot ini proposal proses desain; hasil pilihan harus menyertakan alasan dan contoh.

SVG master tidak boleh berisi raster tersembunyi. Wordmark berbentuk path wajib menyimpan sumber editable dan lisensi font; accessible name disediakan oleh wrapper. Sertakan clear space, minimum size, versi inverse, aturan pemakaian brand color, dan contoh penggunaan keliru. Memiliki file SVG tidak dengan sendirinya membuktikan keaslian atau hak merek; catat provenance dan lakukan review nama/mark sebelum publikasi brand final.

### 5.2 Bahasa ikon

Grid awal 24 × 24, ukuran konsumsi 16/20/24/32, stroke kandidat 1.75 atau 2 yang dipilih lewat sampel. Gunakan `viewBox`, `currentColor`, linecap/linejoin konsisten, dan koreksi optik bila perlu. Jangan memperkecil bentuk kompleks secara mekanis sampai detailnya hilang.

Keluarga wajib awal: home, menu, close, arrows, chevrons, external-link, search, filter, refresh, theme, check, info, warning, error, loading, user, team, lock, logout, settings, globe, agent, modules, knowledge, evidence, history, audit, approval, document, source, copy, download, plus, edit. Daftar ini backlog semantik; setiap ikon harus memiliki consumer atau fixture sebelum masuk rilis.

Ikon dekoratif disembunyikan dari assistive technology. Icon-only button harus punya accessible name pada tombol. Ikon bermakna yang berdiri sendiri punya label; hindari pembacaan label dua kali. Directional icon mendukung RTL bila memang arah baca; logo, simbol geografis, dan ikon non-directional tidak otomatis dicerminkan.

### 5.3 Kontrak distribusi aset

Sumber tunggal berada di package. Favicon atau app icon yang harus disajikan dari direktori public aplikasi merupakan keluaran build dari sumber tersebut, dengan manifest dan pemeriksaan drift; jangan diedit sebagai master kedua. Logo/ikon dimuat melalui named imports agar satu ikon tidak membawa seluruh registry, library peta, atau aset besar.

Konfigurasi sanitasi SVG melarang script, inline event handler, external resource, dan `foreignObject` yang tidak disetujui. ID gradient/mask harus aman ketika beberapa instance muncul sekaligus. Optimasi tidak boleh menghapus `viewBox`, accessible name yang diperlukan, ataupun mengubah bentuk pada ukuran kecil.

## 6. Kontrak komponen dan pola

Setiap komponen wajib mencatat tujuan, anatomi, props, state, keyboard, focus, label, error recovery, responsive behavior, bahasa, tema, density, dan contoh consumer. Gunakan native element bila dapat memenuhi kebutuhan. API presentasi tidak mengambil keputusan izin atau status bisnis.

| Kelompok | Dasar yang sudah ada | Target pengembangan |
| --- | --- | --- |
| Action | Button, buttonClassName | Size resmi, loading, IconButton, konsistensi link action |
| Surface | Panel, MangaEffect | Kontrak surface/emphasis/interactive; satu jalur dekorasi |
| Typography | Styles di beberapa pola | Text, Heading, Eyebrow, Code/metadata bila dibutuhkan consumer |
| Forms | FieldLabel, TextField, TextArea, SelectField, HelpText, FieldError, Switch | Field composition, Checkbox, Radio, SearchField; native select dipertahankan bila cukup |
| Feedback | Notice, LoadingState, EmptyState, ErrorState, Skeleton, ConfirmDialog | ResourceState untuk partial/stale/forbidden; konsistensi announcement |
| Navigation | Tabs | Breadcrumbs, NavItem, NavGroup, MenuToggle, pagination; router supplied by app |
| Content | PageIntro, MangaPageIntro, SectionHeading, StatGrid | PageHeader, MetricCard, Timeline, KeyValueList, Disclosure |
| Data | Lokal aplikasi | DataTable, ListDetail, EventList, filters, selected row; fitur advanced berdasarkan kebutuhan |
| Layout | Lokal aplikasi | Stack, Inline, Grid, Container, Section, PublicShell, WorkspaceShell |
| Brand | SFX, orbit, telemetry hero | LogoMark, BrandLockup, Icon, Illustration, dekorasi bersama |
| Maps | WorldGlobeMap lokal | MapFrame, MapLegend, RegionSummary, SourceAttribution, popup presentation |

Penggabungan API dilakukan hanya setelah pemetaan pemakaian. `MangaPageIntro` boleh menjadi wrapper compatibility untuk PageHeader baru; jangan mempertahankan dua implementasi visual permanen. `MangaEffect` dan `Panel` harus memiliki pembagian tujuan yang terdokumentasi atau berakhir pada implementation surface yang sama.

Tabel semantik menggunakan `<table>` dengan header/caption yang tepat. Jangan menambahkan role grid hanya demi tampilan spreadsheet. Pemilihan baris, sorting, dan pagination diberikan oleh app melalui kontrak controlled yang jelas. Detail kompleks tetap memiliki heading dan actions yang dapat dicapai keyboard.

## 7. Matriks migrasi seluruh permukaan

| Permukaan | Konstruksi target di package | Bukti wajib sebelum cutover |
| --- | --- | --- |
| Portal root layout | PublicShell, BrandLockup, HeaderNav, FooterNav, SkipLink | Navigasi desktop/mobile, theme persistence, bahasa, focus |
| `/` hero | EditorialHero, Illustration, ActionGroup | Hierarki, ID/EN panjang, 320px, dark/light, motion |
| `/` identitas/ekosistem | Section, InfoCard, DomainSymbol, StatusBadge | Grid, wrapping, makna maturity konsisten |
| `/` flow/Explorer | FlowSteps, Tabs, SystemDetail, KeyValueList | Keyboard, orientasi, selected state, long text |
| `/` roadmap teaser/closing | TimelinePreview, CallToAction | Satu primary action per konteks, spacing selaras |
| `/systems` | PageHeader, Breadcrumbs, AtlasList, ModuleGrid, RelatedLinks | Anchor tidak tertutup sticky header; isi tetap terbaca |
| `/roadmap` | PageHeader, Timeline, ReadinessList, CallToAction | Snapshot diberi tanggal review; bukan status live tersirat |
| 404 | NotFoundState, PageLayout | Satu H1, jalan kembali jelas, kedua bahasa |
| Loading route | PageLoading / MangaLoadingState yang diselaraskan | Announcement tunggal, bentuk stabil, reduced motion |
| Error boundary Portal | ErrorState + adapter route | Recovery tersedia; belum ada berarti pekerjaan baru eksplisit |
| Login/pemulihan sesi | AuthLayout, BrandLockup, Field, Checkbox, ResourceState | Label, password autofill, error, retry, focus |
| Shell 100CENTER | WorkspaceShell, SidebarNav, SearchField, Breadcrumbs, ConnectionStatus | Navigasi keyboard/mobile, logout tetap terjangkau, permission-aware |
| Overview | PageHeader, TelemetryHero, MetricGrid, ModuleList, EventList | Loading/partial/error dan freshness dibedakan |
| World | TelemetryHero, MapFrame, MapLegend, RegionSummary, SensorList, FeedList | Map unavailable, fallback daftar, stale, seleksi region, atribusi |
| Continuum | MetricGrid, EntityCard, InvocationForm | Busy state per aksi dan makna hasil invokasi jelas |
| Directory | DataTable, StatusBadge, EmptyState | Header, long name, narrow table, empty versus failure |
| Knowledge | DisclosureList, ScriptText, SourceSummary | Arab/transliterasi, long text, editorial state, keyboard |
| Audit | EventList, Pagination, PayloadDisclosure | Filter scope, timestamp, wrapping payload, loading/empty/error |
| CAB | ListDetail, FormSection, DecisionSummary, ConfirmDialog | Selected state, panjang detail, rollback info, dialog recovery |
| Research | ResearchSummary presentation, EvidenceList, Field, ReviewActions | Validation, source URI, provenance error, pending review, approval recovery |
| Katalog | CatalogShell dan fixtures | Seluruh ekspor, brand/icon gallery, kombinasi tema/density/state |

Nama target dapat disederhanakan bila satu pattern melayani beberapa baris. Matriks ini tidak mengharuskan satu komponen baru untuk setiap baris. Delapan view Command Center saat ini memakai local state; migrasi desain harus mempertahankan perilaku yang ada, dan perbaikan URL/history dicatat sebagai pekerjaan UX tersendiri.

## 8. Protokol migrasi dan pembuktian tidak ada duplikasi

1. Inventaris setiap selector, token, aset dan pola; catat consumer serta kondisi aktifnya.
2. Ambil baseline visual dan interaksi sebelum mengubah CSS; pilih fixture aman untuk alur autentikasi.
3. Petakan setiap aturan ke token, primitive, pattern, decoration, vendor adapter, atau obsolete candidate.
4. Bentuk API package berdasarkan kebutuhan nyata; buat contoh katalog dan kontrak behavior.
5. Migrasikan satu permukaan lengkap berikut semua state dan breakpointnya.
6. Hapus aturan lokal hanya sesudah consumer pindah dan referensi diperiksa; class dinamis diperiksa manual.
7. Bandingkan screenshot dan computed style; dokumentasikan perubahan yang memang disengaja.
8. Tutup checklist permukaan beserta bukti; pindah ke permukaan berikutnya.
9. Setelah semua consumer pindah, hapus compatibility export dan alias sementara yang tidak lagi dipakai.

Menyalin `globals.css` menjadi `packages/ui/portal.css` tanpa menggabungkan sumber desain belum memenuhi target. Styles khusus editorial dapat hidup dalam package, tetapi button, panel, font, badge, spacing dan semantic states harus tetap mengacu pada implementasi bersama.

Duplikasi dibagi menjadi: literal identik; aturan selector identik; representasi konsep yang sama dengan implementasi berbeda; dan aset/master ganda. Selector yang berulang untuk state/media berbeda tidak otomatis duplikasi. Kriteria akhir adalah tidak adanya implementasi paralel untuk konsep yang sama tanpa alasan yang tercatat.

Gunakan allowlist sementara untuk style dinamis/vendor, dengan lokasi, alasan, pemilik dan tanggal evaluasi. Pemeriksa statis memakai AST CSS/TS bila tersedia; pencarian regex berguna sebagai indikator awal tetapi tidak cukup untuk menghitung coverage atau menghapus CSS.

## 9. Tata kelola checklist

ID `UI-Cxx-yy` bersifat tetap. Semua kotak di bawah belum selesai: beberapa fondasi sudah tersedia, tetapi penerimaan target sentralisasi belum dibuktikan. Jangan mengubah `[ ]` menjadi `[x]` hanya karena file ada.

Format bukti setiap item: ID; owner aktual; dependency; perubahan/commit; consumer; fixture; hasil pemeriksaan; keterbatasan; reviewer; tanggal. Status operasional yang boleh digunakan: belum mulai, siap, berjalan, terblokir dengan alasan, siap review, selesai. Checklist tetap biner; status rinci disimpan di evidence log/issue.

Peran owner di bawah adalah kebutuhan tanggung jawab, bukan penugasan orang. Satu orang boleh mengisi beberapa peran, tetapi reviewer penerimaan harus disebutkan. Estimasi waktu baru diberikan setelah baseline, kapasitas dan lingkup tiap slice disepakati.

## 10. Checklist implementasi terperinci

### C00 — Baseline dan keputusan

Owner: maintainer UI + product/design. Dependensi: tidak ada. Gate: inventaris dan keputusan awal dapat ditelusuri.

- [x] **UI-C00-01** — Simpan snapshot workspace dan daftar perubahan aktif sebelum migrasi.
- [x] **UI-C00-02** — Inventaris semua route, view, modal, loading, error, empty dan permission state.
- [x] **UI-C00-03** — Inventaris ekspor package dan consumer aktual setiap ekspor.
- [x] **UI-C00-04** — Inventaris selector lokal, inline style, token literal dan custom property.
- [x] **UI-C00-05** — Petakan duplikasi CSS identik beserta konteks media/theme.
- [ ] **UI-C00-06** — Petakan duplikasi semantik: Metric versus StatGrid, panel versus MangaEffect, headings dan status.
- [x] **UI-C00-07** — Inventaris simbol Unicode, emoji, logo CSS, aset raster/SVG dan lisensinya.
- [ ] **UI-C00-08** — Buat baseline screenshot untuk seluruh permukaan wajib.
- [ ] **UI-C00-09** — Catat owner aktual desain, frontend, aset, copy, aksesibilitas dan review.
- [ ] **UI-C00-10** — Tulis keputusan sentralisasi, pengecualian vendor dan aturan cutover sebagai ADR.
- [ ] **UI-C00-11** — Tandai bukti kontras/visual lama yang perlu diukur ulang.
- [ ] **UI-C00-12** — Sepakati daftar perubahan visual sengaja versus perubahan yang harus mempertahankan baseline.

### C01 — Art direction dan hirarki visual

Owner: design + UI maintainer. Dependensi: C00. Gate: satu arah dipilih melalui contoh nyata.

- [ ] **UI-C01-01** — Susun moodboard berlisensi/provenance jelas untuk Empire Ink.
- [x] **UI-C01-02** — Buat dua atau tiga eksplorasi dalam fixture hero, tabel, form, dan dialog yang sama.
- [ ] **UI-C01-03** — Tentukan peran aksen utama, aksen dekoratif, dan warna status.
- [ ] **UI-C01-04** — Tetapkan hirarki display, heading, body, metadata dan angka.
- [ ] **UI-C01-05** — Tetapkan anatomi halaman: context, title, summary, primary action, content.
- [ ] **UI-C01-06** — Tentukan aturan flat section versus panel agar halaman tidak berisi kartu berlebihan.
- [ ] **UI-C01-07** — Tetapkan aturan tinta, offset shadow dan focus agar tidak bersaing.
- [ ] **UI-C01-08** — Tetapkan profil editorial dan operational beserta batas ornamentasi.
- [ ] **UI-C01-09** — Buat contoh pasangan Portal–100CENTER yang memperlihatkan hubungan keluarga.
- [ ] **UI-C01-10** — Tinjau sampel light/dark, mobile dan teks ID/EN sebelum memilih arah final.
- [ ] **UI-C01-11** — Catat pilihan, alasan, dan trade-off visual yang disetujui.
- [ ] **UI-C01-12** — Bekukan spesifikasi visual v1 untuk wave implementasi pertama.

### C02 — Logo dan identitas produk

Owner: brand/vector designer + maintainer. Dependensi: C01. Gate: master vector dan pedoman dapat dipakai semua konsumen.

- [ ] **UI-C02-01** — Tulis brief makna Empire of the Light, A-L-L-A-H dan 100CENTER.
- [x] **UI-C02-02** — Susun eksplorasi aperture, orbit dan monogram tanpa memakai simbol generik sebagai final otomatis.
- [ ] **UI-C02-03** — Nilai konsep memakai scorecard dan simulasi permukaan produk.
- [ ] **UI-C02-04** — Gambar master mark SVG dengan geometri dan optical correction yang terdokumentasi.
- [ ] **UI-C02-05** — Buat lockup horizontal, stacked dan mark-only.
- [ ] **UI-C02-06** — Buat lockup produk Portal dan 100CENTER dari keluarga induk.
- [ ] **UI-C02-07** — Buat versi monochrome, inverse dan full-brand.
- [ ] **UI-C02-08** — Buat versi optik kecil untuk 16/24/32px bila master kehilangan detail.
- [ ] **UI-C02-09** — Tetapkan clear space dan minimum size berdasarkan hasil render.
- [ ] **UI-C02-10** — Simpan editable wordmark dan catat lisensi font bila outline digunakan.
- [x] **UI-C02-11** — Buat komponen LogoMark dan BrandLockup dengan accessible-name contract.
- [ ] **UI-C02-12** — Buat pipeline favicon/app icon dari master tunggal beserta manifest output.
- [ ] **UI-C02-13** — Tinjau bentuk di grayscale, latar ramai, light/dark dan scaling layar.
- [ ] **UI-C02-14** — Dokumentasikan distorsi, warna, outline dan kombinasi logo yang dilarang.
- [ ] **UI-C02-15** — Catat provenance, creator, lisensi, versi, dan review sebelum penggunaan publik final.
- [ ] **UI-C02-16** — Ganti brand sigil CSS dan mark lokal sesudah semua varian tersedia.

### C03 — Ikon SVG

Owner: vector designer + UI maintainer. Dependensi: C01; selaras C02. Gate: ikon UI utama satu keluarga dan terakses.

- [x] **UI-C03-01** — Kelompokkan semua kebutuhan ikon berdasarkan aksi dan makna.
- [x] **UI-C03-02** — Tentukan satu sumber utama: keluarga original atau satu library berlisensi yang dibungkus package.
- [ ] **UI-C03-03** — Catat lisensi dan cegah pencampuran keluarga stroke tanpa keputusan eksplisit.
- [ ] **UI-C03-04** — Pilih grid, stroke, linecap, linejoin dan ukuran optik melalui sampel.
- [x] **UI-C03-05** — Buat navigasi, arrows, chevrons, menu, close dan external-link.
- [x] **UI-C03-06** — Buat search, filter, refresh, settings, theme, copy dan download.
- [x] **UI-C03-07** — Buat status info/success/warning/error/pending yang dapat dibedakan tanpa warna.
- [x] **UI-C03-08** — Buat user/team/lock/logout serta ikon operasi domain yang dibutuhkan.
- [x] **UI-C03-09** — Terapkan `currentColor`, ukuran resmi dan alignment terhadap teks/button.
- [x] **UI-C03-10** — Buat kontrak decorative versus labelled dan penggunaan IconButton.
- [x] **UI-C03-11** — Tetapkan ikon directional yang boleh dicerminkan untuk RTL.
- [ ] **UI-C03-12** — Optimalkan SVG dan pastikan ID mask/gradient aman untuk banyak instance.
- [ ] **UI-C03-13** — Sediakan named exports dan cek biaya bundle per consumer.
- [x] **UI-C03-14** — Buat galeri nama semantik, ukuran, warna dan contoh benar/salah.
- [x] **UI-C03-15** — Ganti emoji/simbol navigasi dan aksi dengan ikon resmi.
- [ ] **UI-C03-16** — Periksa seluruh ikon pada ukuran kecil, forced colors dan kedua tema.

### C04 — Ilustrasi, motion, dan dekorasi

Owner: design + UI maintainer. Dependensi: C01–C03. Gate: artwork dapat dirakit tanpa CSS app baru.

- [ ] **UI-C04-01** — Inventaris orbit, stars, rays, grid, core, satellite dan SFX saat ini.
- [ ] **UI-C04-02** — Pilih motif inti dan hapus variasi yang tidak memiliki fungsi atau consumer.
- [ ] **UI-C04-03** — Buat DomainSymbol untuk enam domain dengan grid keluarga yang sama.
- [ ] **UI-C04-04** — Buat Illustration frame dengan ukuran/aspect ratio resmi dan clipping yang disengaja.
- [ ] **UI-C04-05** — Buat versi hero, empty dan error yang tidak mengaburkan pesan state.
- [ ] **UI-C04-06** — Pisahkan konten bermakna dari elemen dekoratif `aria-hidden`.
- [ ] **UI-C04-07** — Sediakan reduced-motion rendition yang tetap menyampaikan informasi.
- [ ] **UI-C04-08** — Tokenkan durasi, easing dan intensitas; hindari keyframe identik di beberapa file.
- [ ] **UI-C04-09** — Batasi animasi terus-menerus dan hentikan pekerjaan render saat tidak relevan.
- [ ] **UI-C04-10** — Pastikan motif tidak menutup pointer target, fokus atau isi panjang.
- [ ] **UI-C04-11** — Buat fixture performa dan screenshot light/dark untuk seluruh ilustrasi.
- [ ] **UI-C04-12** — Pensiunkan CSS artwork lokal setelah komposisi package mencapai parity.

### C05 — Token dan tema tunggal

Owner: UI maintainer + design. Dependensi: C01. Gate: seluruh nilai visual memiliki sumber dan kontrak.

- [x] **UI-C05-01** — Pisahkan palette, semantic dan component tokens dengan aturan alias satu arah.
- [x] **UI-C05-02** — Rapikan nama palette yang tidak lagi sesuai warna aktual.
- [x] **UI-C05-03** — Definisikan background/surface/inset/raised/action/selected secara lengkap.
- [ ] **UI-C05-04** — Definisikan text/muted/inverse/link/focus dan pasangan background yang sah.
- [x] **UI-C05-05** — Definisikan foreground/surface/border untuk setiap tone status di kedua tema.
- [x] **UI-C05-06** — Pisahkan token brand dekoratif dari action, warning dan success.
- [ ] **UI-C05-07** — Tetapkan skala typography, line-height, weight, tracking dan tabular numbers.
- [ ] **UI-C05-08** — Tetapkan spacing, reading width, section rhythm dan grid gap.
- [x] **UI-C05-09** — Tetapkan border, radius, elevation, focus dan layer stack.
- [ ] **UI-C05-10** — Tetapkan size kontrol dan density resmi beserta area interaksinya.
- [ ] **UI-C05-11** — Tetapkan breakpoint/container behavior yang digunakan patterns.
- [x] **UI-C05-12** — Satukan palet dark/light dan hentikan penimpaan global berulang.
- [ ] **UI-C05-13** — Definisikan profil editorial/operational sebagai token presentasi yang terbatas.
- [ ] **UI-C05-14** — Tetapkan persistensi tema, initial render dan fallback tanpa storage.
- [ ] **UI-C05-15** — Hitung ulang pasangan kontras token final dan simpan versi paletnya.
- [ ] **UI-C05-16** — Dokumentasikan kombinasi token yang diizinkan serta yang belum ditinjau.
- [ ] **UI-C05-17** — Sediakan kompatibilitas alias lama sementara dengan daftar consumer tersisa.
- [ ] **UI-C05-18** — Hapus alias usang setelah migrasi dan pemeriksaan referensi selesai.

### C06 — API package, CSS, dan distribusi

Owner: frontend maintainer. Dependensi: C00, C05. Gate: Next, Vite dan catalog memakai kontrak yang sama.

- [x] **UI-C06-01** — Tetapkan public exports dan larang deep import dari consumer.
- [ ] **UI-C06-02** — Pisahkan boundary interaksi client tanpa membuat seluruh package menjadi client.
- [x] **UI-C06-03** — Tetapkan satu entry stylesheet resmi dan jalur adapter yang opt-in.
- [ ] **UI-C06-04** — Audit cascade final sebelum memperkenalkan layers atau mengubah import order.
- [ ] **UI-C06-05** — Namespace selector dan batasi reset global sesuai kontrak yang didokumentasikan.
- [x] **UI-C06-06** — Hindari dependency Next/router/API/domain di package presentation.
- [ ] **UI-C06-07** — Definisikan typed slot/link composition tanpa nested interactive element.
- [x] **UI-C06-08** — Dokumentasikan dukungan ref, native attributes dan controlled/uncontrolled state.
- [ ] **UI-C06-09** — Definisikan aturan className/style prop dan compatibility allowlist.
- [x] **UI-C06-10** — Pastikan import ikon/logo tidak menarik map engine atau seluruh asset registry.
- [ ] **UI-C06-11** — Buat mekanisme asset public derivation tanpa master ganda.
- [ ] **UI-C06-12** — Verifikasi build consumer Next, Vite, dan catalog serta hydration terkait.
- [x] **UI-C06-13** — Tetapkan aturan perubahan breaking dengan migrasi consumer dalam perubahan yang sama.
- [x] **UI-C06-14** — Catat jalur penghapusan `manga-theme.css` lama bila diserap entry baru.

### C07 — Typography, layout dan surface

Owner: UI maintainer. Dependensi: C05–C06. Gate: layout inti tidak memerlukan desain ulang di app.

- [x] **UI-C07-01** — Bangun Container dengan reading/content/workspace width resmi.
- [x] **UI-C07-02** — Bangun Stack, Inline dan Grid dengan spacing token serta wrapping.
- [ ] **UI-C07-03** — Bangun Section dan page rhythm editorial/operational.
- [x] **UI-C07-04** — Tetapkan Heading/Text/metadata API yang menjaga semantic element.
- [x] **UI-C07-05** — Sediakan Arabic/script fallback dan line-height yang tidak memotong glyph.
- [x] **UI-C07-06** — Satukan kontrak Panel/surface dan shared manga treatment.
- [x] **UI-C07-07** — Bedakan clickable card, static card dan selected card secara semantik.
- [x] **UI-C07-08** — Satukan PageIntro/MangaPageIntro melalui satu anatomi header.
- [x] **UI-C07-09** — Matangkan SectionHeading untuk long title/actions pada layar sempit.
- [x] **UI-C07-10** — Satukan MetricCard/StatGrid dengan value, label, detail, tone dan freshness.
- [x] **UI-C07-11** — Sediakan Divider, KeyValueList dan CodeBlock hanya untuk kebutuhan yang terpetakan.
- [x] **UI-C07-12** — Periksa min-width, overflow, panjang angka, teks tanpa spasi dan wrapping.

### C08 — Action, form dan feedback

Owner: UI maintainer + accessibility reviewer. Dependensi: C05–C07. Gate: state dan interaksi inti konsisten.

- [x] **UI-C08-01** — Matangkan Button size/variant/loading/disabled dan alignment ikon.
- [x] **UI-C08-02** — Sediakan IconButton dengan accessible name wajib.
- [x] **UI-C08-03** — Samakan ActionLink dan buttonClassName tanpa mengubah semantik tautan.
- [x] **UI-C08-04** — Sediakan ActionGroup dengan prioritas aksi serta wrapping mobile.
- [x] **UI-C08-05** — Susun Field yang menghubungkan label, hint, error dan control ID unik.
- [x] **UI-C08-06** — Pertahankan native autofill, validation, read-only dan input mode.
- [x] **UI-C08-07** — Buat Checkbox untuk remember-me; audit Radio berdasarkan kebutuhan nyata.
- [x] **UI-C08-08** — Satukan SearchField, clear action, shortcut hint dan scope label.
- [x] **UI-C08-09** — Matangkan SelectField/TextArea pada teks panjang dan browser native controls.
- [x] **UI-C08-10** — Bedakan error field, error form, error request dan Notice global.
- [x] **UI-C08-11** — Tentukan announcement tunggal untuk hasil aksi dan perubahan resource.
- [x] **UI-C08-12** — Sediakan state initial/loading/empty/filtered-empty/error/partial/stale/forbidden sesuai kebutuhan.
- [x] **UI-C08-13** — Pertahankan data lama saat refresh dengan penanda kesegaran yang jujur.
- [x] **UI-C08-14** — Matangkan dialog focus return, Escape, pending, error dan cancellation semantics.
- [x] **UI-C08-15** — Pastikan disabled/busy tidak menghilangkan konteks alasan atau label tindakan.
- [ ] **UI-C08-16** — Buat contoh katalog keyboard dan form error recovery.

### C09 — Navigation dan shell

Owner: UI maintainer + app maintainers. Dependensi: C02–C03, C07–C08. Gate: shell konsisten dan seluruh aksi dapat dijangkau.

- [ ] **UI-C09-01** — Bangun BrandHeader dan PublicShell dengan slot navigasi/footer.
- [ ] **UI-C09-02** — Bangun WorkspaceShell dengan expanded/collapsed/mobile navigation.
- [ ] **UI-C09-03** — Bangun NavItem/NavGroup dengan current, disabled dan badge count.
- [ ] **UI-C09-04** — Terima daftar navigasi hasil permission filtering dari app.
- [x] **UI-C09-05** — Bangun Breadcrumbs dan SkipLink dengan landmark target yang sah.
- [ ] **UI-C09-06** — Tetapkan focus management setelah view berubah dan judul diperbarui.
- [ ] **UI-C09-07** — Pastikan mobile menu dapat ditutup dan fokus kembali sesuai jenis menunya.
- [ ] **UI-C09-08** — Pertahankan logout dan identitas operator dapat dijangkau di mobile.
- [x] **UI-C09-09** — Buat ThemeControl dan language control presentation dengan state pending yang selesai.
- [ ] **UI-C09-10** — Tetapkan sticky-header offset dan anchor focus antarhalaman.
- [x] **UI-C09-11** — Sediakan ConnectionStatus/freshness dan hindari klaim online dari indikator dekoratif.
- [ ] **UI-C09-12** — Dokumentasikan adapter Next Link dan navigasi local-state Vite.

### C10 — Pola data dan operasional

Owner: UI maintainer + Command Center maintainer. Dependensi: C07–C09. Gate: view operasi dirakit dari patterns resmi.

- [x] **UI-C10-01** — Buat DataTable semantic dengan caption, headers, alignment angka dan empty state.
- [x] **UI-C10-02** — Tentukan perilaku tabel sempit: scroll berlabel atau card representation yang benar.
- [x] **UI-C10-03** — Sediakan Pagination controlled dengan total/next availability yang jujur.
- [x] **UI-C10-04** — Buat FilterBar dan empty-search recovery sesuai cakupan data yang benar.
- [x] **UI-C10-05** — Buat ListDetail dengan selected item, mobile navigation dan focus behavior.
- [x] **UI-C10-06** — Buat EntityCard/summary slots tanpa ketergantungan model API.
- [x] **UI-C10-07** — Buat EventList dengan timestamp, actor, action dan details disclosure.
- [x] **UI-C10-08** — Buat Disclosure dan payload/source summary dengan keyboard native.
- [x] **UI-C10-09** — Buat Timeline dan ReadinessList yang membedakan snapshot dari data live.
- [x] **UI-C10-10** — Buat FormSection, ReviewActions dan DecisionSummary dengan urutan informasi jelas.
- [x] **UI-C10-11** — Buat status presentation map terketik di app; package hanya menerima label/tone/icon.
- [ ] **UI-C10-12** — Buat fixture seluruh pola dengan long content, empty, partial dan failure.

### C11 — Peta dan visualisasi data

Owner: Command Center maintainer + UI maintainer. Dependensi: C05, C07–C10. Gate: peta menjadi bagian keluarga UI tanpa membebani konsumen lain.

- [x] **UI-C11-01** — Inventaris MapLibre controls, popup, markers, legend dan inline style.
- [x] **UI-C11-02** — Buat MapFrame dengan title, toolbar, source, timestamp dan fallback.
- [x] **UI-C11-03** — Pindahkan vendor skin ke adapter opt-in package dan dokumentasikan selector vendor.
- [x] **UI-C11-04** — Sediakan palet map light/dark dan mapping status yang tidak hanya mengandalkan warna.
- [x] **UI-C11-05** — Buat RegionSummary, MapLegend dan marker tokens untuk konsistensi tampilan.
- [x] **UI-C11-06** — Pastikan attribution tetap terbaca dan dapat dijangkau.
- [x] **UI-C11-07** — Sediakan daftar region yang dapat dioperasikan tanpa interaksi canvas.
- [x] **UI-C11-08** — Bedakan loading, WebGL unavailable, API failure, stale dan empty map.
- [x] **UI-C11-09** — Dokumentasikan reduced motion dan penghentian animasi globe.
- [x] **UI-C11-10** — Pastikan package default/Portal tidak memuat map runtime.

### C12 — Migrasi Portal

Owner: Portal maintainer. Dependensi: C02–C10. Gate: semua route dan state Portal memakai package.

- [ ] **UI-C12-01** — Migrasikan layout header/footer/navigation/logo/skip link.
- [ ] **UI-C12-02** — Migrasikan initial theme dan theme control dengan fallback storage.
- [ ] **UI-C12-03** — Migrasikan hero utama, orbit, satellite dan SFX melalui pola resmi.
- [ ] **UI-C12-04** — Migrasikan stat band dan identity cards.
- [ ] **UI-C12-05** — Migrasikan domain/frontier cards beserta icons dan maturity labels.
- [ ] **UI-C12-06** — Migrasikan flow dan architecture layers tanpa CSS layout paralel.
- [ ] **UI-C12-07** — Migrasikan Explorer tabs/detail dan selected state di kedua tema.
- [ ] **UI-C12-08** — Migrasikan roadmap teaser dan closing CTA.
- [ ] **UI-C12-09** — Migrasikan `/systems` intro, atlas, module grid dan crosslinks.
- [ ] **UI-C12-10** — Migrasikan `/roadmap` timeline, readiness, tanggal review dan CTA.
- [ ] **UI-C12-11** — Migrasikan 404 serta loading pada seluruh route.
- [ ] **UI-C12-12** — Tambahkan/adaptasikan error boundary dengan recovery yang didukung app.
- [ ] **UI-C12-13** — Hilangkan metadata sistem berulang yang saling menutupi di homepage; data tetap milik Portal.
- [ ] **UI-C12-14** — Rapikan string ID/EN, termasuk entity HTML dalam string JavaScript yang tampil literal.
- [ ] **UI-C12-15** — Hapus global styles dan manga overrides lama setelah semua consumer pindah.
- [ ] **UI-C12-16** — Tutup matriks desktop/mobile/theme/language/navigation seluruh route.

### C13 — Migrasi Command Center

Owner: Command Center maintainer. Dependensi: C02–C11. Gate: delapan view, autentikasi dan seluruh state memiliki bukti.

- [ ] **UI-C13-01** — Migrasikan login dan pemulihan sesi ke AuthLayout dan BrandLockup.
- [ ] **UI-C13-02** — Migrasikan remember-me, login errors dan health feedback.
- [ ] **UI-C13-03** — Migrasikan sidebar/operator identity, nav, logout dan mobile shell.
- [ ] **UI-C13-04** — Migrasikan topbar, breadcrumb, pencarian, sync dan timestamp.
- [ ] **UI-C13-05** — Migrasikan overview hero, metrics, module list dan activity preview.
- [ ] **UI-C13-06** — Migrasikan World header, region cards, sensors dan feed.
- [ ] **UI-C13-07** — Integrasikan map adapter, fallback daftar dan state kegagalan; jangan tampilkan loading tanpa akhir.
- [ ] **UI-C13-08** — Migrasikan Continuum agent cards dan invocation forms.
- [ ] **UI-C13-09** — Migrasikan Directory table dan resource states.
- [ ] **UI-C13-10** — Migrasikan Knowledge disclosure, Arabic content dan source metadata.
- [ ] **UI-C13-11** — Migrasikan Audit list, payload details dan pagination.
- [ ] **UI-C13-12** — Migrasikan CAB list/detail, create form, decision actions dan dialog.
- [ ] **UI-C13-13** — Migrasikan Research list, creation, evidence dan review actions.
- [ ] **UI-C13-14** — Tampilkan validasi provenance JSON yang dapat dipulihkan tanpa kehilangan isi form.
- [ ] **UI-C13-15** — Selaraskan bahasa UI dan atribut `lang`; jangan hardcode bahasa dokumen yang salah.
- [ ] **UI-C13-16** — Pecah view untuk memudahkan review tanpa memindahkan workflow bisnis ke package.
- [ ] **UI-C13-17** — Hapus Metric dan primitive visual lokal yang telah diganti pola resmi.
- [ ] **UI-C13-18** — Hapus stylesheet desain lokal serta inline literal setelah adapter/pattern tersedia.
- [ ] **UI-C13-19** — Periksa permission state dan pastikan visual tidak membuka aksi yang dilarang server.
- [ ] **UI-C13-20** — Tutup matriks seluruh view, dialog, state dan perangkat dengan fixture aman.

### C14 — Aksesibilitas, bahasa dan responsivitas

Owner: accessibility reviewer + app maintainers. Dependensi: setiap slice C07–C13. Gate: bukti nyata, bukan asumsi dari atribut ARIA.

- [ ] **UI-C14-01** — Tetapkan target WCAG 2.2 AA dan checklist kriteria relevan dengan rujukan resmi saat implementasi.
- [ ] **UI-C14-02** — Audit landmarks, urutan heading dan satu judul utama per permukaan.
- [ ] **UI-C14-03** — Audit seluruh perjalanan keyboard, skip link dan focus visibility.
- [ ] **UI-C14-04** — Audit focus setelah navigation, menu, dialog, validation dan deletion jika ada.
- [ ] **UI-C14-05** — Tinjau screen reader untuk form, Tabs, dialog, table dan announcement.
- [ ] **UI-C14-06** — Ukur kontras pasangan teks, kontrol, ikon bermakna dan indikator fokus pada render final.
- [ ] **UI-C14-07** — Tinjau 320/375/768/1024/1440px serta tepat sebelum/sesudah breakpoint penting.
- [ ] **UI-C14-08** — Tinjau zoom 200%/400% dan reflow; pisahkan overflow tabel yang memang diperlukan.
- [ ] **UI-C14-09** — Tinjau target sentuh, jarak aksi dan operasi tanpa hover.
- [ ] **UI-C14-10** — Tinjau reduced motion, forced colors dan preferensi kontras yang didukung.
- [ ] **UI-C14-11** — Tinjau ID/EN, Arabic glyph, transliterasi, tanda baca dan bidi isolation.
- [ ] **UI-C14-12** — Tinjau string panjang, angka besar, identifier tanpa spasi dan text scaling.
- [ ] **UI-C14-13** — Tinjau loading/failure/empty/stale/forbidden dengan bantuan teknologi.
- [ ] **UI-C14-14** — Catat browser/OS/perangkat bukti dan keterbatasan yang belum ditutup.

### C15 — Katalog dan dokumentasi hidup

Owner: UI maintainer. Dependensi: berjalan bersama C02–C14. Gate: package dapat dipahami tanpa membaca source aplikasi.

- [ ] **UI-C15-01** — Buat halaman foundations, tokens, theme dan density.
- [ ] **UI-C15-02** — Buat galeri logo/lockup/favicons dan aturan brand.
- [ ] **UI-C15-03** — Buat icon gallery dengan nama, usage dan ukuran optik.
- [ ] **UI-C15-04** — Beri setiap public export contoh, state dan consumer reference.
- [ ] **UI-C15-05** — Tambahkan fixture TelemetryHero, shell, table, ListDetail dan map presentation.
- [ ] **UI-C15-06** — Tambahkan fixture halaman Portal dan semua kategori view operasi.
- [ ] **UI-C15-07** — Tambahkan kontrol theme/density/language/viewport untuk reproduksi review.
- [ ] **UI-C15-08** — Dokumentasikan composition recipe dan contoh anti-pattern override lokal.
- [ ] **UI-C15-09** — Dokumentasikan status stable/experimental/deprecated setiap API.
- [ ] **UI-C15-10** — Simpan seluruh fixture sebagai data fiktif tanpa credential atau data tenant.
- [ ] **UI-C15-11** — Perbarui README package, consumer map dan petunjuk asset generation.
- [ ] **UI-C15-12** — Hubungkan perubahan API dengan changelog, migration note dan bukti visual.

### C16 — Pemeriksaan otomatis dan performa

Owner: frontend/tooling maintainer. Dependensi: C06, C15. Gate: drift terdeteksi sebelum rilis.

- [ ] **UI-C16-01** — Jalankan typecheck dan production build package/Portal/Command Center/catalog.
- [ ] **UI-C16-02** — Tambahkan pemeriksaan import internal package dan dependency terlarang.
- [ ] **UI-C16-03** — Tambahkan pemeriksaan literal desain dan stylesheet app dengan allowlist beralasan.
- [ ] **UI-C16-04** — Tambahkan deteksi duplikasi deklarasi dalam konteks selector/media yang sama.
- [ ] **UI-C16-05** — Tambahkan manifest asset/provenance validation dan generated asset drift check.
- [ ] **UI-C16-06** — Uji perilaku kritis: keyboard, dialog, forms, controlled states dan hydration.
- [ ] **UI-C16-07** — Tambahkan regression screenshots deterministik dengan font siap dan waktu/data tetap.
- [ ] **UI-C16-08** — Jalankan pemeriksaan aksesibilitas otomatis, lalu lengkapi review manual.
- [ ] **UI-C16-09** — Ukur CSS/JS/font/asset bundle sebelum dan setelah migrasi per consumer.
- [ ] **UI-C16-10** — Tetapkan budget numerik setelah baseline, catat pengecualian yang disetujui.
- [ ] **UI-C16-11** — Periksa tree shaking ikon dan lazy loading runtime peta.
- [ ] **UI-C16-12** — Ukur layout shift dan respons interaksi pada fixture halaman nyata.
- [ ] **UI-C16-13** — Tinjau regresi SVG rendering dan keamanan external reference.
- [ ] **UI-C16-14** — Pastikan CI gagal untuk pelanggaran terverifikasi tanpa menghalangi style dinamis yang sah.

### C17 — Cutover, cleanup dan pemeliharaan

Owner: UI maintainer + reviewer produk. Dependensi: seluruh gate wajib. Gate: semua consumer memakai sistem tunggal.

- [ ] **UI-C17-01** — Pastikan tiap baris matriks permukaan memiliki bukti penerimaan.
- [ ] **UI-C17-02** — Pastikan tidak ada palette, button, panel, badge, field, logo atau icon master paralel di app.
- [ ] **UI-C17-03** — Hapus kompatibilitas dan token lama yang sudah tidak memiliki consumer.
- [ ] **UI-C17-04** — Tinjau seluruh pengecualian; tetapkan owner dan alasan untuk yang masih diperlukan.
- [ ] **UI-C17-05** — Perbarui blueprint lama agar bukti historis tidak dibaca sebagai kondisi terbaru.
- [ ] **UI-C17-06** — Catat baseline visual baru beserta versi token dan aset.
- [ ] **UI-C17-07** — Sediakan rollback per wave melalui commit migrasi yang dapat dipisahkan.
- [ ] **UI-C17-08** — Pastikan rollback tidak mencampurkan API baru dengan stylesheet lama.
- [ ] **UI-C17-09** — Review workflow Portal dan operasi dengan pengguna/perwakilan produk.
- [ ] **UI-C17-10** — Tetapkan proses perubahan komponen: kebutuhan → contoh → kontrak → consumer → review.
- [ ] **UI-C17-11** — Tetapkan reviewer perubahan token, brand, icon dan shared behavior.
- [ ] **UI-C17-12** — Publikasikan release note internal dengan cakupan selesai dan keterbatasan yang tersisa.

## 11. Wave kerja dan gerbang keputusan

| Wave | Isi | Dependensi keluar | Syarat selesai |
| --- | --- | --- | --- |
| W0 — Baseline | C00, arah C01 | Keputusan dan inventaris disetujui | Seluruh permukaan terdaftar, baseline tersimpan, scope jelas |
| W1 — Identitas dan fondasi | C02–C06 | Token/API/assets cukup untuk pilot | Logo/icon core, light/dark, kontrak CSS, sample katalog |
| W2 — Pilot lintas produk | C07–C09; login + `/systems` | Satu slice dari setiap app | Header/button/form/panel identik sumbernya, kedua app lolos review |
| W3 — Portal lengkap | C12 + pattern editorial C10 | Portal cutover | Tiga route + state + ID/EN + dua tema selesai |
| W4 — Operasi inti | C10, C13 overview/directory/knowledge/audit/continuum | Shared data patterns stabil | State data dan navigasi mobile lengkap |
| W5 — Workflow dan peta | C11, C13 CAB/research/world | Seluruh view selesai | Recovery form/dialog/map serta freshness terbukti |
| W6 — Penerimaan akhir | C14–C17 penutupan | Rilis sistem tunggal | Tidak ada drift yang belum diputuskan; bukti lengkap |

C14 aksesibilitas, C15 katalog dan C16 pemeriksaan berjalan pada setiap wave, bukan ditunda ke W6. W6 menutup cakupan keseluruhan. Brand exploration dan inventaris tooling dapat berlangsung bersamaan jika dikerjakan tim, tetapi token/API pilot harus stabil sebelum migrasi massal.

Pilot sengaja memakai `/systems` dan login: keduanya cukup kecil untuk membuktikan package di Next dan Vite, sambil mencakup logo, header, CTA, panel, form, focus, theme, dan responsivitas. Setelah pilot lolos, pola yang sama dapat dipakai pada homepage dan view operasi yang lebih kompleks.

Jangan menjalankan seluruh wave sebagai satu perubahan besar. Pecah menurut slice yang dapat ditinjau dan dibatalkan. Rollback memulihkan komponen serta styles yang cocok pada slice tersebut; tidak menimpa pekerjaan lain yang tidak terkait.

## 12. Rencana verifikasi dan ukuran keberhasilan

| Dimensi | Sampel wajib | Bukti |
| --- | --- | --- |
| Integrasi | Next Portal, Vite Command Center, Vite catalog | Typecheck/build dan render/hydration |
| Tema | Light/dark pada setiap pola dan permukaan | Screenshot dan computed-token checks |
| Viewport | 320, 375, 768, 1024, 1440; batas breakpoint | Tidak ada clipping tak disengaja; overflow data berlabel |
| Bahasa | ID/EN dan konten Arab/transliterasi yang ada | Wrapping, heading, labels, direction, font fallback |
| Input | Keyboard, pointer, touch; zoom | Urutan fokus, target, dialog, navigation |
| State | Initial/loading/success/empty/error; partial/stale/forbidden bila relevan | Fixture + integrasi representative |
| Workflow | Login, cari, pilih detail, submit, review, retry, logout | Perjalanan lengkap dengan data uji aman |
| Assets | Logo/icons pada ukuran kecil, mono, inverse | SVG render, collision ID, manifest/provenance |
| Aksesibilitas | Automated + manual assistive technology | Issue list, perbaikan, catatan batas |

Full Cartesian product semua dimensi tidak wajib untuk setiap screenshot. Setiap halaman tetap diuji pada dua tema dan desktop/mobile; kontrol kritis menjalani semua state dalam katalog; kombinasi berisiko seperti mobile + ID panjang + dark + error wajib dipilih eksplisit. Catat coverage agar sampling tidak berubah menjadi klaim coverage penuh.

Ukuran keberhasilan yang dilaporkan:

- **Coverage permukaan:** jumlah baris matriks yang diterima / total baris wajib; target 100%.
- **Coverage public API:** ekspor dengan kontrak dan fixture / seluruh ekspor rilis; target 100%.
- **Master visual paralel:** implementasi independen button/panel/field/badge/logo/icon utama di app; target 0.
- **Literal desain di app:** temuan di luar allowlist sah; target 0 setelah cutover.
- **Aset tanpa provenance:** aset yang dirilis tanpa manifest; target 0.
- **Regresi belum diputuskan:** perbedaan visual/perilaku yang belum diperbaiki atau disetujui; target 0 sebelum penerimaan.
- **Performa:** perubahan terhadap baseline dan budget yang ditetapkan W1; tidak mengarang target berdasarkan angka yang belum diukur.
- **Kegunaan:** tugas login, temukan informasi, tinjau detail dan pulihkan error dapat diselesaikan melalui jalur yang diuji.

Untuk aturan produk yang membutuhkan backend, fixture hanya membuktikan presentasi/interaksi lokal. Gate end-to-end tetap terbuka sampai integrasi aman tersedia; jangan menggunakan data produksi atau mengklaim UI telah menguji otorisasi server hanya dari hidden button.

## 13. Risiko dan mitigasi

| Risiko | Tanda awal | Mitigasi |
| --- | --- | --- |
| Pemindahan duplikasi ke package | File portal/command CSS disalin tanpa konsolidasi | Ukur konsep paralel dan consumer, bukan sekadar lokasi file |
| Shared package terlalu besar | Satu ikon menarik banyak aset/runtime | Explicit entry, named imports, budget per consumer |
| Regressi cascade | Screenshot berubah saat import order berubah | Computed-style baseline, cutover per slice, layer strategy eksplisit |
| Abstraksi terlalu rumit | Banyak boolean/variant yang bertentangan | Sempitkan props sesuai contoh nyata; gunakan komposisi |
| Brand mengalahkan operasi | Tabel/form penuh animasi dan kontras dekoratif | Operational profile dan batas ornamentasi |
| Dark/light hanya tampak berhasil di katalog | Overlay/page art gagal di app | Matriks halaman dan token pairs pada render final |
| State salah dilaporkan | Gagal fetch terlihat loading atau empty | Resource-state contract, adapter domain dan failure fixture |
| Copy/domain bocor ke package | Package mengimpor API atau nama tenant | Dependency checks, slot/props presentasi |
| Migrasi menghapus kerja aktif | Workspace berisi banyak perubahan | Snapshot, perubahan scoped, tidak reset seluruh repo |
| Aset ganda tumbuh lagi | SVG disalin ke public lalu diedit manual | Generated asset manifest dan drift check |
| Dokumentasi dianggap bukti terbaru | Angka kontras lama dipakai untuk tema baru | Versi palet/commit pada setiap evidence record |

## 14. Keputusan yang masih perlu ditutup saat pelaksanaan

| ID | Keputusan | Default perencanaan | Bukti pemilihan |
| --- | --- | --- | --- |
| D01 | Master logo final | Eksplorasi tiga konsep; pilih satu keluarga | Scorecard + preview lintas permukaan |
| D02 | Keluarga icon | Satu sumber utama dengan SVG wrapper package | Lisensi, optical review dan bundle |
| D03 | Palet final | Empire Ink dari identitas yang ada, dibersihkan | Kontras, light/dark, sample workflow |
| D04 | Theme default | Pertahankan preferensi awal sampai review produk; kedua tema didukung | First render dan preference behavior |
| D05 | Density default | Comfortable Portal; compact terbatas operasi | Keterbacaan, touch dan data scanning |
| D06 | Export/deprecation detail | Workspace-private, consumer dimigrasikan bersama | Next/Vite build dan usage inventory |
| D07 | Routing Command Center | Pertahankan local-state behavior dalam migrasi visual | Kebutuhan deep-link/history dicatat terpisah |
| D08 | Anggaran performa | Baseline dahulu, threshold numerik W1 | Bundle/runtime measurements |

Keputusan desain dapat ditinjau lewat artefak konkret selama wave terkait. Blueprint ini sudah cukup untuk memulai W0 tanpa menunggu pilihan estetika final atau membuat seluruh komponen sekaligus.

## 15. Template penerimaan satu slice

Gunakan template berikut pada issue/PR implementasi; bukan checklist selesai otomatis.

```text
Slice / wave:
ID checklist:
Owner / reviewer:
Permukaan dan user task:
Baseline revision + screenshot:
API package yang dipakai/ditambah:
Aturan/aset lokal yang dihapus:
Perubahan visual yang disengaja:
Tema / bahasa / viewport / state yang diperiksa:
Bukti keyboard / accessibility / workflow:
Hasil build / integrasi / performa:
Pengecualian dengan alasan dan owner:
Risiko tersisa:
Langkah rollback:
Status penerimaan + tanggal:
```

### Catatan bukti wave W0
| UI-C00-05 | Audit parser PostCSS pada 15 stylesheet authoring milik Portal, Command Center, dan `packages/ui/src` (tanpa output build/vendor). Scan awal menghitung 136 hit deklarasi berulang pada selector/konteks yang sama; cleanup menghapus 41 blok rule Portal yang identik dan memusatkan reset dasar (`:root`, box-sizing, body margin, link decoration, dan brand alignment) di `packages/ui/src/styles.css`. Scan ulang menyisakan 18 grup deklarasi berulang di layer tema/override Portal, yang dicatat untuk harmonisasi pada migrasi halaman berikutnya; hasilnya belum berarti nol duplikasi CSS. | Peta mencakup konteks selector, media, dan theme. Reset lintas produk yang diperiksa kini punya satu owner package; duplikasi residual Portal tetap menjadi pekerjaan implementasi. Pada slice 2026-10-22, reset setara di `packages/ui/src/products/command-center.css` juga dihapus setelah dipusatkan; font inheritance dan focus ring lintas produk kini juga hanya didefinisikan di `packages/ui/src/styles.css`, sementara warna/link dan background tetap product-specific. Typecheck UI dan build katalog UI lulus. Browser visual acceptance tidak dilakukan pada slice ini. |

| ID | Bukti yang diperiksa | Hasil dan batas |
| --- | --- | --- |
| UI-C00-01 | Revisi dasar workspace `c5ef355` pada branch `dev`; sebelum slice ini working tree hanya memiliki perubahan tiga dokumen blueprint (`docs/BLUEPRINT_UI.md`, `packages/ui/README.md`, dan dokumen ini). | Snapshot sumber telah dikenali dan perubahan yang bukan milik migrasi tidak tercampur. Screenshot baseline belum tersedia; UI-C00-08 tetap terbuka. |
| UI-C00-02 | `apps/portal/app`: `/`, `/systems`, `/roadmap`, root layout, not-found, serta loading root/systems/roadmap. Komponen bersama: `PrimaryNavigation`, `PortalPageChrome`, `Explorer`, `RouteLoading`. `apps/command-center/src/App.tsx`: views `overview`, `world`, `continuum`, `directory`, `knowledge`, `audit`, `cab`, `research`; login dan pemulihan sesi berada sebelum shell; `ConfirmDialog` ada di shell; resource state muncul di view. Peta berada di `WorldMonitorView.tsx` dan `WorldGlobeMap.tsx`. | Inventaris permukaan kode tersedia. Error boundary Portal, seluruh kombinasi permission/state, dan screenshot alur memerlukan review implementasi tambahan; itu tetap tercatat di item khusus, bukan dianggap teruji oleh inventaris. |
| UI-C00-03 | Enumerasi `packages/ui/src/index.ts`: 52 baris ekspor bertipe/nilai; consumers `apps/portal`, `apps/command-center`, dan `packages/ui/catalog/main.tsx` memakai package entry `@empire/ui`. Stylesheets diekspor melalui subpath resmi `@empire/ui/ui.css`, `/portal.css`, `/command-center.css`, dan opt-in `/adapters/maplibre.css` pada `packages/ui/package.json`. | Export dan consumer entry telah ditemukan. Cakupan contoh katalog per ekspor belum dipetakan; tetap harus ditutup pada UI-C15-04. |
| UI-C00-04 | Audit repo per 2026-10-22: pencarian `*.css|scss|sass|less` di kedua folder app menemukan 0 stylesheet; pencarian prop/objek `style` menemukan 0; deklarasi custom property (`--name:`) menemukan 0; warna literal hex menemukan 1 di `apps/command-center/index.html` (`theme-color #120e20`), lalu dihapus dan nilainya sekarang dibaca dari token `--eol-color-background` di `main.tsx`. Class hooks pada JSX masih banyak untuk komposisi produk, tetapi aturan selector seluruhnya tinggal di `packages/ui/src/products/`. Glyph logo/fallback ◐ dan ◈ yang ditemukan saat scan sudah diganti; inventaris semua karakter simbol dicatat pada UI-C00-07. | Inventaris sumber selector, inline styling, properti, dan nilai literal app selesai dengan satu temuan warna ditutup. Scan tidak menganggap class hook semantik sebagai master visual paralel. Memerlukan pemeriksaan ulang jika route atau app baru ditambahkan. |
| UI-C00-07 | Inventaris non-ASCII di source `apps/portal` dan `apps/command-center` pada 2026-10-22: 66 directional arrows (← 7, → 18, ↑ 2, ↓ 4, ↗ 34, ↘ 1), 67 middle-dot pemisah metadata, 4 simbol derajat untuk koordinat, serta punctuation tipografi (mdash 8, ellipsis 10, apostrophe 13, bullet 1) dan 283 box-drawing characters yang hanya dipakai divider komentar. Tidak ditemukan emoji. Dari baseline 66 directional arrows, 52 affordance/navigation kemudian dimigrasikan ke SVG; 14 panah yang tersisa berada dalam sequence workflow/infografik dan dipertahankan sebagai copy. Pencarian file SVG/raster (`svg/png/jpeg/webp/gif/avif`) dan inline `<svg>` di folder app menemukan 0; dua pseudo-logo lokal Portal/Command Center telah dihapus. Vector icons/candidate mark tinggal sebagai source path di `packages/ui/src`; font WOFF2 self-hosted dan lisensi Fontsource sudah didokumentasikan di `packages/ui/README.md` serta `packages/ui/licenses/`. | Inventaris glyph dan file aset tercatat; emoji, logo CSS lokal, dan asset raster/SVG duplikat app tidak ditemukan. Inventaris ini tidak menutup provenance/licensing review final yang masih terbuka di C02-15/C03-03. |
| UI-C01-02, UI-C02-02 | `packages/ui/src/brand/BrandConcepts.tsx` memuat vector path asli untuk tiga arah (aperture, orbit, monogram). `packages/ui/catalog/main.tsx` menaruhnya dalam fixture sama; tiap arah ditampilkan sebagai lockup A-L-L-A-H, lockup 100CENTER, mark kecil, hero, ringkasan status operasional dengan search field, dan dialog konfirmasi. | Tiga kandidat siap dibandingkan dalam dark/light preview katalog. Bukan logo produksi terpilih; review tampilan di viewport nyata dan keputusan konsep final masih terbuka. |
| UI-C02-02, UI-C02-06, UI-C02-11, UI-C02-16 (migrasi awal) | `packages/ui/src/brand/BrandConcepts.tsx` mengekspor `LogoMark` dan `BrandLockup`; lockup menyatukan mark dekoratif, nama produk, descriptor, ukuran regular/compact, dan tone nama default/subtle. Portal header/footer dan Command Center sidebar menggunakannya. Teks nama/descriptor tetap berupa copy pemilik app; mark SVG, hierarki, ukuran, serta tone tersedia di package dan katalog menampilkan dua produk berdampingan. Bentuk Orbit masih provisional. | `LogoMark` memiliki `aria-hidden` dan nama/descriptor visual menjadi nama teks lockup; link Portal juga mempertahankan label lokal yang dilokalkan. Typecheck UI, Portal, Command Center dan build katalog lulus. UI-C02-11 selesai pada kontrak/kode; tidak mengklaim validasi assistive tech. Tidak ada lagi CSS pseudo-element/glyph mark atau master teks lockup lokal pada shell yang diaudit. C02-16 tetap terbuka sampai varian master lengkap, scorecard, lisensi/provenance dan review screenshot light/dark/responsif selesai. |
| UI-C03-01, UI-C03-02, UI-C03-05–10, UI-C03-14 | `packages/ui/src/primitives/Icon.tsx` menjadi sumber tunggal 47 ikon vektor buatan, dikelompokkan tanpa nama ganda ke Navigation, Actions, Status, Identity & access, serta Product & operations. Sistemnya memakai grid 24 × 24, stroke 1.8px, dan `currentColor`; path tidak memakai ID, gradient, raster, library eksternal, atau asset URL. `Icon` menyembunyikan dekorasi dari assistive tech secara default dan menyediakan `label` untuk ikon bermakna mandiri. Galeri katalog memuat semua nama, ukuran 16/20/24/32px, warna aksen/muted, dan contoh pairing aksesibel. Consumer awal: Command Center navigation/workspace/search/sync/logout/API link/World Monitor dan Portal external-link/theme toggle. `pnpm --filter @empire/ui catalog:build` menghasilkan bundle katalog 260.26 KB (79.89 KB gzip) yang mencakup seluruh katalog, bukan ukuran ikon per consumer. | Struktur dan contoh katalog terkompilasi. Belum ada review visual screenshot (browser bridge gagal), ukuran kecil belum disetujui art-direction, lisensi/provenance belum disahkan pemilik, dan perubahan simbol di semua halaman belum selesai. Tidak menutup UI-C03-03/04/11/12/13/15/16 atau penerimaan keseluruhan ikon. |
| UI-C03-01, UI-C03-02, UI-C03-05–10, UI-C03-14 | `packages/ui/src/primitives/Icon.tsx` menjadi sumber tunggal 47 ikon vektor buatan, dikelompokkan tanpa nama ganda ke Navigation, Actions, Status, Identity & access, serta Product & operations. Sistemnya memakai grid 24 × 24, stroke 1.8px, dan `currentColor`; path tidak memakai ID, gradient, raster, library eksternal, atau asset URL. `Icon` menyembunyikan dekorasi dari assistive tech secara default dan menyediakan `label` untuk ikon bermakna mandiri. Galeri katalog memuat semua nama, ukuran 16/20/24/32px, warna aksen/muted, dan contoh pairing aksesibel. Consumer awal: Command Center navigation/workspace/search/sync/logout/API link/World Monitor dan Portal external-link/theme toggle. `pnpm --filter @empire/ui catalog:build` menghasilkan bundle katalog 260.26 KB (79.89 KB gzip) yang mencakup seluruh katalog, bukan ukuran ikon per consumer. | Struktur dan contoh katalog terkompilasi. Belum ada review visual screenshot (browser bridge gagal), ukuran kecil belum disetujui art-direction, lisensi/provenance belum disahkan pemilik, dan perubahan simbol di semua halaman belum selesai. Tidak menutup UI-C03-03/04/11/12/13/15/16 atau penerimaan keseluruhan ikon. |
| UI-C06-03, UI-C06-14 | Public exports `@empire/ui/ui.css`, `/portal.css`, dan `/command-center.css` menjadi jalur stylesheet resmi. `ui.css` menyusun token mentah → tema semantik → style komponen/font. Portal entry menambahkan Portal globals lalu Portal presentation; Command Center mengimpor shared entry, vendor MapLibre, lalu entry presentasi Command Center satu kali. Semua CSS presentasi produk dimiliki `packages/ui/src/products/`. Subpath lama `styles.css`/`manga-theme.css` tidak diekspor; stylesheet `manga-theme.css` telah dihapus setelah token dan nilai efektifnya diserap ke `tokens.css`/`themes.css`. | Build Command Center dan katalog UI berhasil; typecheck Portal dan UI berhasil. Respons baca-saja ke dev server lokal `5173` dan `3300` masing-masing memberi 200 dan judul 100CENTER / Portal yang benar. Sesi ini tidak menghasilkan screenshot karena bridge computer-use gagal memastikan URL tab secara aman; respons HTTP dan build bukan bukti penerimaan visual. Tidak ada file CSS presentasi tersisa di folder apps. Inline styles dan beberapa pola/class produk masih memerlukan migrasi; production `next build` tetap tidak dijalankan selagi dev server aktif agar `.next` tidak bertabrakan. |
| UI-C06-01 | `packages/ui/package.json` membatasi exports ke entry TypeScript root dan empat subpath stylesheet resmi. Scan consumer menemukan hanya `@empire/ui` serta subpath resmi; tidak ada import `packages/ui/src/*` atau subpath stylesheet lama. | Public boundary dan aturan no-deep-import memiliki bukti statis. Enforcement lint/CI otomatis dan katalog per-export masih terbuka di UI-C15-04. |
| UI-C06-06 | Scan dependency dan import pada `packages/ui/src` tidak menemukan Next, router, API contract, atau package domain; runtime dependency package hanya React peer serta Fontsource. Consumer app tetap memiliki routing, data, auth, dan workflow di luar package presentation. | Boundary presentation bebas dependency domain pada snapshot audit ini. Scan perlu diulang bila package UI menambah adapter atau integration baru. |
| UI-C06-10 | `Icon.tsx` dan `BrandConcepts.tsx` hanya berisi path SVG inline dengan `currentColor`; scan tidak menemukan MapLibre, map engine, raster URL, asset registry, atau dynamic asset import pada jalur ikon/logo. MapLibre tetap berada pada adapter CSS opt-in dan consumer Command Center. | Import boundary statis lulus. Provenance dan pemilihan logo final tetap terbuka pada UI-C02-16/C06-11. |
| UI-C06-13 | `packages/ui/README.md` menetapkan additive changes, kewajiban update semua consumer dan katalog untuk breaking change, migration notes, deprecation window, serta repository-wide usage check sebelum removal. | Aturan perubahan breaking sudah terdokumentasi pada kontrak package; enforcement CI dan migration tooling otomatis masih terbuka. |
| UI-C06-08 | `packages/ui/README.md` kini mendokumentasikan ref forwarding dan native attributes untuk `Button`, `IconButton`, `Switch`, `Checkbox`, `TextField`, `TextArea`, dan `SelectField`, serta controlled/uncontrolled preservation melalui `Field`; exported polymorphic patterns mendokumentasikan `as` contract. Implementasi control refs memakai `forwardRef`. | `pnpm --filter @empire/ui typecheck` lulus setelah Switch/Checkbox ref forwarding. Browser ref/focus acceptance dan consumer migration tetap terbuka pada UI-C15-04. |
| UI-C07-02 | `packages/ui/src/patterns/Layout.tsx` mengekspor `Stack`, `Inline`, dan `Grid` dengan `LayoutSpace` typed (`1`–`12`), alignment/justification, wrapping inline, serta responsive auto-fit grid. Class/data API dan spacing mapping dimiliki `packages/ui/src/styles.css`; tidak ada spacing literal di consumer. | `pnpm --filter @empire/ui typecheck` dan `pnpm --filter @empire/ui catalog:build` lulus. Katalog visual khusus layout dan browser narrow-width review masih perlu ditambahkan pada UI-C15-04/UI-C07-12. |
| UI-C07-04 | `packages/ui/src/patterns/Typography.tsx` mengekspor `Heading` dengan level semantic `h1`–`h6`, `Text` dengan element `p`/`span`/`div`, dan `Metadata` untuk label mono. Semua menerima `className`; heading mempertahankan id dan tidak mengganti struktur heading consumer. | `pnpm --filter @empire/ui typecheck` lulus. Audit migrasi semua heading app, line wrapping pada Arabic/script, dan fixture katalog typography masih terbuka pada UI-C07-05/UI-C15-04. |
| UI-C08-02 | `packages/ui/src/primitives/IconButton.tsx` mengekspor tombol ikon dengan union type yang mewajibkan tepat satu accessible name (`aria-label` atau `aria-labelledby`), type button default, dan ukuran `sm`/`md`/`lg`. | `pnpm --filter @empire/ui typecheck` lulus. Consumer migration dan visual fixture katalog masih terbuka pada UI-C15-04; icon-only controls lama perlu diganti bertahap. |
| UI-C08-01 | `packages/ui/src/primitives/Button.tsx` kini memiliki typed `size` (`sm`/`md`/`lg`), `variant`, `loading`, disabled preservation, `aria-busy`, spinner, dan wrapper alignment untuk children/icon. Shared CSS mengatur ukuran, gap, focus, serta reduced-motion compatibility melalui package token. | `pnpm --filter @empire/ui typecheck` lulus. Consumer-specific size choices dan visual state fixture katalog masih perlu ditinjau pada UI-C15-04. |
| UI-C08-05 | `packages/ui/src/primitives/Field.tsx` menghubungkan label ke control ID eksplisit atau `useId` fallback, menggabungkan `aria-describedby` untuk hint/error, menandai `aria-invalid`, serta mempertahankan native control element melalui `cloneElement`. | `pnpm --filter @empire/ui typecheck` lulus. Consumer migration dan browser validation/native autofill review tetap terbuka pada UI-C08-06/UI-C15-04. |
| UI-C08-08 | `packages/ui/src/primitives/SearchField.tsx` menyatukan input `type=search`, ikon vektor, scope label opsional, shortcut hint, dan clear action dengan accessible name. CSS shared mengatur focus-within, wrapping, native input inheritance, dan clear affordance. | `pnpm --filter @empire/ui typecheck` lulus. Migrasi search consumer serta fixture keyboard/clear di katalog masih terbuka pada UI-C15-04. |
| UI-C07-11 | `packages/ui/src/patterns/ContentPatterns.tsx` mengekspor `Divider` horizontal/vertical, `KeyValueList` semantic `dl/dt/dd`, dan `CodeBlock` `pre/code` dengan overflow aman. Semua style dan token dimiliki `packages/ui/src/styles.css`. | `pnpm --filter @empire/ui typecheck` lulus. Consumer mapping dan fixture katalog masih perlu ditambahkan ketika kebutuhan halaman dimigrasikan. |
| UI-C07-12 | Shared CSS memeriksa `min-width: 0` pada layout/panel/control content, `overflow-wrap: anywhere` pada button, state, dialog, key/value, dan metric text, `overflow: auto` pada CodeBlock, serta flex/grid wrapping pada Inline/Grid/ActionGroup. Angka panjang dan token metadata tidak memaksa container melebar. | Source audit terverifikasi dan UI typecheck sebelumnya lulus. Browser narrow-width/zoom and route-level screenshot acceptance tetap terbuka pada UI-C15-04. |
| UI-C08-11 | `packages/ui/src/primitives/LiveRegion.tsx` menyediakan satu primitive announcement dengan `aria-live` typed (`polite`/`assertive`/`off`), `aria-atomic`, dan visually-hidden presentation. | `pnpm --filter @empire/ui typecheck` lulus. Integrasi consumer untuk mengganti announcement ad hoc dan audit timing browser masih terbuka pada UI-C15-04. |
| UI-C08-12 | `packages/ui/src/patterns/ResourceState.tsx` mengekspor state typed `initial`, `loading`, `empty`, `filtered-empty`, `error`, `partial`, `stale`, dan `forbidden`, dengan copy default, action slot, custom copy, serta `aria-live` untuk loading. | `pnpm --filter @empire/ui typecheck` lulus. Consumer migration dan visual/content review tiap resource masih terbuka pada UI-C15-04. |
| UI-C08-13 | `ResourceState` mempertahankan `children` content saat state `stale` atau `partial`, lalu menampilkan indicator title/description/action di sekeliling data lama. Consumer dapat memberi refresh action tanpa mengganti hasil terakhir dengan loading blank state. | `pnpm --filter @empire/ui typecheck` lulus setelah slot content ditambahkan. Consumer refresh integration dan timing review masih terbuka pada UI-C15-04. |
| UI-C08-14 | `ConfirmDialog` memakai native modal dialog, menangani Escape melalui `onCancel`, memblokir cancellation saat busy, mempertahankan error/pending state, menjaga focus trap Tab, dan kini menyimpan opener lalu mengembalikan focus setelah close bila elemen masih terhubung dan tidak disabled. | `pnpm --filter @empire/ui typecheck` lulus. Browser-level focus/VoiceOver acceptance masih perlu dilakukan pada UI-C15-04. |
| UI-C08-03 | `ActionLink` memakai `buttonClassName` dan `ButtonVariant` yang sama, tetapi merender native `<a>` dengan `AnchorHTMLAttributes`; tidak ada role/button emulation atau nested interactive element. | `pnpm --filter @empire/ui typecheck` lulus setelah export baru. Consumer migration dan keyboard/browser fixture masih terbuka pada UI-C15-04. |
| UI-C08-04 | `ActionGroup` menyediakan alignment `start`/`center`/`end`/`between`, flex wrapping, gap token, dan mobile breakpoint yang memberi setiap action ruang fleksibel tanpa mengubah semantik child button/link. | `pnpm --filter @empire/ui typecheck` lulus setelah export baru. Prioritas visual per workflow dan narrow viewport review masih terbuka pada UI-C15-04. |
| UI-C08-07 | `Checkbox` shared mempertahankan native `input[type=checkbox]`, label semantik, optional description via `aria-describedby`, checked/disabled/required/name/value attributes, dan accent token package. Radio belum ditambahkan karena audit kebutuhan saat ini hanya menemukan remember-me checkbox. | `pnpm --filter @empire/ui typecheck` lulus. Consumer migration dan browser autofill/keyboard review masih terbuka pada UI-C15-04. |
| UI-C08-09 | `SelectField` dan `TextArea` tetap merender native `<select>`/`<textarea>`, meneruskan seluruh native attributes dan ref, memakai `overflow-wrap`/font inheritance shared, serta memberi textarea tinggi minimum dan resize vertical. Select tidak mematikan browser appearance. | Source audit dan `pnpm --filter @empire/ui typecheck` lulus. Browser-native rendering/long-option acceptance masih perlu diuji pada UI-C15-04. |
| UI-C08-10 | `FieldError` memakai paragraph `role=alert` untuk field-level error; `ErrorState` menyediakan `alert` atau `region` untuk request/form failure dengan labelled heading; `Notice` memisahkan tone info/success/warning/danger dan role `status`/`alert`/`note`. | Role and component source audit terverifikasi. Consumer announcement sequencing dan browser assistive-tech acceptance masih terbuka pada UI-C15-04. |
| UI-C08-15 | `Button` mempertahankan children label saat `loading`, menambahkan spinner dan `aria-busy`, serta hanya menonaktifkan aksi selama proses; `ConfirmDialog` menampilkan `busyLabel`, mempertahankan deskripsi/error, dan mencegah Escape/cancel saat busy. Native controls tetap mempertahankan label/description ketika disabled. | Source audit dan `pnpm --filter @empire/ui typecheck` lulus pada slice terkait. Browser announcement/timing dan consumer reason copy masih perlu diuji pada UI-C15-04. |
| UI-C09-05 | `Breadcrumbs` merender native `nav`/`ol` dengan `aria-current="page"` dan hanya membuat link untuk item non-current; `SkipLink` memiliki target landmark configurable (default `#main-content`) dan visible-on-focus treatment shared. | `pnpm --filter @empire/ui typecheck` lulus setelah export pattern baru. Consumer landmark wiring dan keyboard browser acceptance masih terbuka pada UI-C15-04. |
| UI-C09-11 | `StatusIndicator` selalu merender readable text bersama dot shape cue dan menerima explicit tone; tidak ada klaim “online” bawaan. `MetricGrid` menerima freshness text sebagai slot app-owned, sehingga connection/freshness meaning berasal dari data consumer, bukan dekorasi package. | Source audit terverifikasi dan UI typecheck sebelumnya lulus. Consumer connection data mapping dan live freshness acceptance masih terbuka pada UI-C15-04. |
| UI-C09-09 | Portal `PrimaryNavigation` memakai shared `Switch` untuk theme control dan semantic pressed language buttons dalam labeled group. Language transition menonaktifkan controls, mengumumkan status pending, lalu membersihkan pending state setelah server language prop berubah; theme state tersimpan dan dipulihkan melalui `eol-theme`. | Source audit terverifikasi; `pnpm --filter @empire/portal typecheck` dijalankan setelah perubahan. Browser visual acceptance masih terbuka pada UI-C15-04. |
| UI-C10-01 | `DataTable<Row>` menyediakan typed columns/cell renderer, semantic caption, `scope="col"`, numeric alignment (`start`/`center`/`end`), stable `rowKey`, and table-level empty row. Wrapper memberi horizontal overflow tanpa mengubah table semantics. | `pnpm --filter @empire/ui typecheck` lulus. Consumer migration, caption copy, and narrow-table behavior review masih terbuka pada UI-C10-02/UI-C15-04. |
| UI-C10-02 | `DataTable` memberi wrapper overflow horizontal yang focusable (`tabIndex=0`) dengan `role=region` dan configurable `responsiveLabel`; markup tetap table semantic, sehingga narrow viewport memiliki scroll berlabel tanpa memalsukan card layout. | `pnpm --filter @empire/ui typecheck` lulus setelah responsive label ditambahkan. Consumer label localization dan browser narrow-table review masih terbuka pada UI-C15-04. |
| UI-C10-03 | `Pagination` controlled menerima `page`, `totalPages`, dan `onPageChange`, clamps invalid values, disables previous/next pada boundary, dan mengumumkan current/total melalui `aria-live`. | `pnpm --filter @empire/ui typecheck` lulus setelah pattern baru. Consumer total/availability mapping dan keyboard/browser review masih terbuka pada UI-C15-04. |
| UI-C10-04 | `FilterBar` menerima arbitrary filter/search controls, result scope label, dan clear/recovery action tanpa dependency model API; flex wrapping menjaga controls pada narrow viewport. Digabungkan dengan `SearchField` clear action dan `ResourceState` filtered-empty untuk recovery semantik. | `pnpm --filter @empire/ui typecheck` lulus. Consumer filter scope wiring dan empty-search copy/visual acceptance masih terbuka pada UI-C15-04. |
| UI-C10-05 | `ListDetail<Item, Key>` menyediakan typed item key, selected fallback, listbox/option semantics, selected detail region, empty state, `onSelect`, and responsive single-column mobile layout. Consumer retains ownership of model data and detail rendering. | `pnpm --filter @empire/ui typecheck` lulus. Focus return after mobile detail transitions and consumer migration remain open at UI-C15-04. |
| UI-C10-08 | `Disclosure` memakai native `<details>/<summary>` dengan payload content slot, keyboard semantics bawaan browser, dan overflow-safe source/payload copy. Tidak ada custom open state atau dependency domain. | `pnpm --filter @empire/ui typecheck` lulus setelah export pattern baru. Consumer payload/source mapping dan visual review masih terbuka pada UI-C15-04. |
| UI-C10-09 | `Timeline` menerima item snapshot-neutral dengan label/title/description/timestamp; `ReadinessList` menerima item label/status/detail dan explicit `mode="snapshot"|"live"`, sehingga presentation tidak menyimpulkan realtime tanpa data consumer. | `pnpm --filter @empire/ui typecheck` lulus setelah pattern baru. Consumer data freshness mapping dan visual acceptance masih terbuka pada UI-C15-04. |
| UI-C10-10 | `FormSection` mengurutkan title/description/content, `ReviewActions` memakai ActionGroup shared, dan `DecisionSummary` memisahkan decision/rationale slots sebagai semantic aside. Semua tetap domain-neutral. | `pnpm --filter @empire/ui typecheck` lulus setelah pattern baru. Consumer workflow mapping dan visual review masih terbuka pada UI-C15-04. |
| UI-C10-11 | `WorldGlobeMap.tsx` memiliki `MapStatus` union dan app-owned status list/labels; package `MapLegend` menerima typed status/label, `RegionSummary` menerima status ReactNode dan Badge tone, tanpa mengimpor model API atau domain status mapping ke package. | Source audit dan prior UI typecheck/build evidence lulus. Map light/dark contrast and browser visual review tetap terbuka pada UI-C11-04/UI-C15-04. |
| UI-C11-06 | `WorldGlobeMap.tsx` mengaktifkan MapLibre `attributionControl`, memberi imagery source attribution pada raster source, dan `MapLegend` menerima optional attribution slot. Adapter CSS menjaga attribution link contrast/focus melalui vendor selector. | Source audit terverifikasi; actual browser attribution visibility/focus review tetap terbuka pada UI-C15-04. |
| UI-C11-04 | `themes.css` kini mendeklarasikan map status/label/marker aliases pada dark dan light theme; map adapter memakai alias tersebut. `MapLegend` selalu menampilkan status label text bersama swatch, dan marker/popup expose `data-status`/aria label sehingga status tidak bergantung pada warna saja. | Token/source audit dan prior UI typecheck/build evidence lulus. Basemap-specific contrast dan screenshot light/dark browser review tetap terbuka pada UI-C15-04. |
| UI-C10-07 | `EventList` menerima event domain-neutral berupa `id`, `timestamp`, `actor`, `action`, dan optional `details`; merender ordered list, semantic `time`, empty state, dan `Disclosure` native untuk payload. | `pnpm --filter @empire/ui typecheck` lulus setelah pattern baru. Consumer timestamp formatting, actor semantics, and visual review masih terbuka pada UI-C15-04. |
| UI-C10-06 | `EntityCard` menyediakan title, meta, summary, status, actions, selected, dan interactive slots dengan `Card` surface contract; tidak mengimpor model API, permission, atau domain type. | `pnpm --filter @empire/ui typecheck` lulus setelah pattern baru. Consumer mapping dan visual review masih terbuka pada UI-C15-04. |
| UI-C08-06 | `TextField`, `TextArea`, `SelectField`, dan `Checkbox` menerima serta meneruskan native props seperti `name`, `autoComplete`, `required`, `pattern`, `readOnly`, `inputMode`, `value/defaultValue`, `checked/defaultChecked`, dan `disabled`; tidak ada wrapper yang mengganti browser validation/autofill behavior. | Source audit dan `pnpm --filter @empire/ui typecheck` lulus. Browser autofill matrix dan end-to-end form acceptance masih terbuka pada UI-C15-04. |
| UI-C07-09 | `SectionHeading` memiliki `section`/`compact` layout, level semantic `h2`/`h3`, aside slot untuk action/status, `min-width: 0` untuk title wrapping, dan media query ≤640px yang menumpuk title dan aside secara vertikal. | Implementasi package dan CSS responsive terverifikasi lewat source audit; typecheck UI sebelumnya lulus. Screenshot narrow viewport dan route-level migration review tetap terbuka pada UI-C15-04. |
| UI-C07-06 | `Panel` menyediakan `as` polymorphic, `manga` flag, dan surface token tunggal; `MangaEffect` mengomposisikan panel, interactive/action/row, texture, speed-lines, reveal, dan motion flags melalui class contract package. CSS `.eol-panel`, `.eol-manga-surface`, dan `.eol-manga-panel` hanya dimiliki shared stylesheet. | Source audit dan typecheck UI sebelumnya lulus. Review visual treatment lintas halaman serta clickable/static card migration masih terbuka pada UI-C07-07/UI-C15-04. |
| UI-C07-07 | `Card` pattern membedakan static default `article`, interactive state melalui `interactive`/`data-interactive`, dan selected state melalui `selected`/`data-selected`; `as` tetap dikendalikan consumer sehingga clickable card dapat memakai native `button` atau `a` tanpa role emulation. | `pnpm --filter @empire/ui typecheck` lulus. Consumer migration dan keyboard visual acceptance tetap terbuka pada UI-C15-04. |
| UI-C07-08 | `MangaPageIntro` hanya mengomposisikan `PageIntro` dengan class treatment manga/reveal dan optional SFX/decoration; breadcrumb, eyebrow, title, description, actions, dan class hooks berasal dari satu `PageIntroProps` anatomy. | Source audit dan `pnpm --filter @empire/ui typecheck` sebelumnya lulus. Route-level visual review dan responsive acceptance tetap terbuka pada UI-C15-04. |
| UI-C07-05 | `tokens.css` menyediakan `--eol-font-script` dengan fallback Arabic/Hebrew/Devanagari dan `--eol-line-height-script`; shared stylesheet menerapkan family dan line-height melalui `:lang`-compatible attribute selectors untuk script yang membutuhkan glyph metrics lebih longgar. | Token/style implementation terverifikasi dan UI typecheck sebelumnya lulus. Font loading aktual, shaping, RTL visual review, dan browser matrix masih terbuka pada UI-C15-04. |
| UI-C05-01, UI-C05-02, UI-C05-03, UI-C05-05, UI-C05-06, UI-C05-09, UI-C05-12 | `packages/ui/src/tokens.css` kini memisahkan shared palette dari component/layout tokens dan menggunakan nama warna yang sesuai. `packages/ui/src/themes.css` menjadi satu-satunya deklarasi semantic color untuk light/dark, dengan alur alias dari raw palette ke role; default tanpa atribut tetap dark. Surface mencakup background, surface, raised, inset, action, selected; setiap status (neutral/info/success/warning/danger) memiliki foreground/surface/border di kedua tema. Token border width, radius, elevation, focus, dan layer stack tersedia di satu sumber. Aksen dekoratif manga memakai `--eol-manga-*`; action, focus, dan status punya role terpisah. Override `color-scheme` di stylesheet produk/katalog dihapus agar tema menetapkan warna kontrol native sekali saja. `manga-theme.css` dihapus dan `ui.css` mengimpor token → theme → component. | `pnpm --filter @empire/ui typecheck`, `pnpm --filter @empire/command-center build`, `pnpm --filter @empire/ui catalog:build`, `pnpm --filter @empire/portal typecheck`, dan `git diff --check` berhasil. Build Command Center mempertahankan peringatan chunk besar yang telah ada (1,358.49 KB / 381.43 KB gzip); ini tidak terkait token/CSS. Request HTTP ke kedua app aktif memberi 200. Contrast final, screenshot light/dark per halaman, matriks tema, kepatuhan status pada background aktual, dan seluruh warna literal CSS produk masih perlu audit; karena itu C05-04/15/16 dan visual acceptance tidak ditandai selesai. |
| UI-C05-01, UI-C05-02, UI-C05-03, UI-C05-05, UI-C05-06, UI-C05-09, UI-C05-12 | `packages/ui/src/tokens.css` kini memisahkan shared palette dari component/layout tokens dan menggunakan nama warna yang sesuai. `packages/ui/src/themes.css` menjadi satu-satunya deklarasi semantic color untuk light/dark, dengan alur alias dari raw palette ke role; default tanpa atribut tetap dark. Surface mencakup background, surface, raised, inset, action, selected; setiap status (neutral/info/success/warning/danger) memiliki foreground/surface/border di kedua tema. Token border width, radius, elevation, focus, dan layer stack tersedia di satu sumber. Aksen dekoratif manga memakai `--eol-manga-*`; action, focus, dan status punya role terpisah. Override `color-scheme` di stylesheet produk/katalog dihapus agar tema menetapkan warna kontrol native sekali saja. `manga-theme.css` dihapus dan `ui.css` mengimpor token → theme → component. | `pnpm --filter @empire/ui typecheck`, `pnpm --filter @empire/command-center build`, `pnpm --filter @empire/ui catalog:build`, `pnpm --filter @empire/portal typecheck`, dan `git diff --check` berhasil. Build Command Center mempertahankan peringatan chunk besar yang telah ada (1,358.49 KB / 381.43 KB gzip); ini tidak terkait token/CSS. Request HTTP ke kedua app aktif memberi 200. Contrast final, screenshot light/dark per halaman, matriks tema, kepatuhan status pada background aktual, dan seluruh warna literal CSS produk masih perlu audit; karena itu C05-04/15/16 dan visual acceptance tidak ditandai selesai. |
| UI-C11-01, UI-C11-03, UI-C11-05, UI-C11-07, UI-C11-09, UI-C11-10 | Audit `WorldGlobeMap.tsx` menemukan kontrol MapLibre, popup HTML, marker yang disusun lewat `style.cssText`, status hex terpisah, legenda dengan inline swatch, dan marker region cards sebagai jalur tanpa canvas. Skin kontrol/popup dipindah ke public opt-in `@empire/ui/adapters/maplibre.css`, diimpor hanya oleh Command Center setelah stylesheet vendor. Status marker/popup/legend kini memakai `data-status` dan `--eol-map-status-*` dari token package. `MapLegend` dan `RegionSummary` menjadi pola package tanpa tipe domain atau dependency MapLibre; katalog menampilkan fixture keduanya. Region picker tetap native button dengan `aria-pressed`. `prefers-reduced-motion` mematikan pulse marker dan entrance summary. `@empire/ui` tidak memiliki dependency runtime MapLibre dan `ui.css`/Portal tidak mengimpor adapter. Inline color/style map serta empat inline style di `WorldMonitorView` dihapus. | Belum ada screenshot map/WebGL atau pemeriksaan light-map karena sumber peta aktif dikunci pada dark basemap. C11-04 tetap terbuka sampai style basemap, status pada kedua tema, dan contrast diuji bersama; C11-06/08 masih menunggu audit attribution/keyboard dan kegagalan/stale/empty. `RegionSummary`/`MapLegend`/adapter terkompilasi lewat catalog build dan Command Center production build; package dan Portal typecheck lulus. Daftar region dapat dicapai sebagai tombol tanpa peta menurut markup, belum diuji keyboard browser pada sesi ini. |

Dasar bukti di atas adalah pembacaan file dan pencatatan branch/revisi, bukan pengujian visual. ID ini ditutup pada 22 Oktober 2026 sebelum perubahan implementasi; pemeriksaan ulang diperlukan bila baseline/revisi berubah sebelum wave berikutnya.

Pembaruan identitas vector wave W1: `pnpm --filter @empire/ui typecheck`, `pnpm --filter @empire/ui catalog:build`, dan `git diff --check` berhasil. Katalog mengompilasi kandidat SVG sebagai bagian dari package UI. Browser review tidak dilakukan pada sesi login Command Center yang sudah terbuka; perubahan tema dan tampilan tetap menunggu pemeriksaan manual. Kandidat tidak diekspor sebagai logo resmi sampai C02-03 dan keputusan desain berikutnya ditutup.

Pembaruan ikon vector wave W1: `pnpm --filter @empire/ui typecheck`, `pnpm --filter @empire/command-center typecheck`, `pnpm --filter @empire/portal typecheck`, `pnpm --filter @empire/command-center build`, `pnpm --filter @empire/ui catalog:build`, dan `git diff --check` berhasil. `localhost:5173` merespons 200 dengan judul 100CENTER, tetapi transport browser/screenshot Codex gagal tersambung; tidak ada klaim review visual. Whole-app Command Center build mengeluarkan chunk 1,358.49 KB (381.42 KB gzip) beserta peringatan batas chunk 500 KB; angka ini mencakup app/vendor dan bukan pengukuran biaya ikon terisolasi. Bundle katalog juga bukan ukuran consumer. Lisensi eksternal tidak dipakai; penetapan lisensi aset produk masih memerlukan pemilik repo.

Pembaruan UI-C11 map patterns: `MapFrame`, `MapLegend`, dan `RegionSummary` kini diekspor dari `@empire/ui`; style pola umum masuk ke `ui.css`, sedangkan `adapters/maplibre.css` hanya menyimpan skin selector/runtime MapLibre. MapFrame mengumumkan loading dengan `aria-busy`, membedakan `ready`, `empty`, `stale`, `error`, `unavailable`, dan `webgl-unavailable`, serta menampilkan fallback aksesibel. Command Center menyambungkan loading, kesalahan sumber peta, dan kegagalan WebGL ke frame; status peta siap menjelaskan bahwa marker hanyalah lokasi referensi dan telemetry regional belum tersedia. MapLibre attribution tetap disediakan kontrol native, dan salinan atribusi di legenda dihapus agar tidak ganda. Katalog memberi contoh setiap state. `pnpm --filter @empire/ui typecheck`, `pnpm --filter @empire/command-center build`, `pnpm --filter @empire/ui catalog:build`, `pnpm --filter @empire/portal typecheck`, serta `git diff --check` berhasil. Build Command Center menghasilkan chunk 1,361.42 KB / 382.36 KB gzip dan memperingatkan batas 500 KB. Pengujian screenshot, interaksi attribution, light basemap, dan kontras pada peta belum dilakukan; UI-C11-04 dan UI-C11-06 tetap terbuka. Link lokal dari pengguna telah dicoba melalui browser Codex, tetapi transport browser sedang tertutup; respons HTTP tidak menggantikan review visual.

Pembaruan parsial audit token dan ikon: warna enam domain Explorer Portal dihapus dari objek konten dan dipindahkan ke raw palette + alias `--eol-system-*` shared untuk dua tema; selector domain hanya memilih token semantik. Inline CSS custom property di komponen dihapus. Ikon SVG `input`, `output`, dan `activity` masuk registry, grup, dan katalog otomatis; Explorer serta dua feed Command Center menggunakan ikon package menggantikan panah/penanda Unicode dekoratif. Typecheck UI, Portal, Command Center, katalog UI, dan `git diff --check` berhasil. Ini belum menyelesaikan seluruh inventaris Unicode atau penerimaan visual ikon; UI-C03-15/16 tidak ditandai selesai.

Pembaruan parsial migrasi ikon glyph UI-C03/C08: `Icon` package menambah `chevronUp`; status dot tidak lagi ditulis sebagai Unicode di hero monitor, melainkan dihasilkan melalui indikator CSS semantik dengan label status tetap terlihat. Metadata timestamp/capability/continuum, marker aktivitas, info notice, agent glyph, directional navigation audit, tab Explorer input/output, dan action arrow di Portal/Command Center memakai SVG `@empire/ui`. `style` literal inline dan enam warna hex domain sudah hilang dari file app hasil search ini. Pemeriksaan string menunjukkan panah masih tersisa sebagai bagian dari copy workflow, read order, tautan serta ekspresi yang memang menyampaikan arah/urutan; brand mark Command Center tetap berupa glyph karena tidak ada master logo yang telah dipilih dan disetujui. `pnpm --filter @empire/ui typecheck`, `pnpm --filter @empire/portal typecheck`, `pnpm --filter @empire/command-center typecheck`, `pnpm --filter @empire/command-center build`, `pnpm --filter @empire/ui catalog:build`, dan `git diff --check` berhasil. Chunk Command Center 1,362.08 KB / 382.42 KB gzip masih melewati warning 500 KB; logo final, pemetaan RTL, forced colors, pemeriksaan ikon kecil, serta screenshot/visual acceptance masih terbuka sehingga checklist C03/C08 tidak ditutup.

Keputusan directional UI-C03-11: registry `directionalIconNames` menetapkan hanya `chevronLeft`, `chevronRight`, `arrowLeft`, `arrowRight`, `arrowUpRight`, `arrowDownRight`, `input`, dan `output` untuk dicerminkan di konteks `dir="rtl"`; semua nama icon lain tidak berubah. `Icon` menerapkan mapping tersebut otomatis dan memberikan override eksplisit bila consumer perlu pengecualian. Katalog memiliki fixture arah LTR/RTL; build kompilasi saja belum menjadi review visual rendering di browser.

Kontrak baru status UI: `StatusIndicator` package menggabungkan dot berbentuk dan label teks dengan tone neutral/info/success/warning/danger. Dua consumer World Monitor dan overview Command Center kini memakai komponen ini; status unavailable/unknown memakai tone neutral, degraded memakai warning, dan operational memakai success. Selector `.live-pill` khusus produk dihapus. Katalog memuat contoh operational/degraded/unknown. Typecheck UI, Portal, Command Center; build catalog dan Command Center; `git diff --check` berhasil. Status dot tetap tampak sebagai cue bentuk dan teks menyampaikan state, tetapi kontras final seluruh pasangan light/dark dan visual review masih belum terukur.

Pembaruan migrasi affordance panah UI-C03-15: `IconText` package kini memasangkan label visible dengan SVG dekoratif dan mengikuti RTL melalui directional icon registry. Portal memakai pattern pada header/footer actions, home page CTAs, card links, crosslinks, page breadcrumbs, external links, dan page-intro navigation; link data menyebut `IconName`, bukan karakter glyph. Flow connector dan countdown World Monitor memakai `Icon` langsung. 52 dari 66 directional arrow baseline telah diganti dengan SVG; 14 karakter → yang tersisa hanya menjelaskan sequence “sources → analysis → review → decision” dan workflow ResearchRun → Approval pada copy/infografik. Pemindaian simbol setelah migrasi tidak menemukan panah di navigation/action link. Typecheck UI, Portal, Command Center, build katalog, dan build Command Center berhasil; tidak ada visual screenshot review, jadi C03-16 dan penerimaan visual tetap terbuka.

Pembaruan pola metrik operasional: `packages/ui/src/patterns/MetricGrid.tsx` dan `metric-grid.css` menyediakan grid responsif dengan label, value, detail opsional, tone status, dua density, kolom 2/3/4, wrapping, breakpoint, dan forced-colors; pemetaan status domain tetap dilakukan di app. Command Center mengganti helper `Metric` dan ringkasan pada overview, Continuum, Directory, serta CAB; World Monitor kini memakai `MetricGrid` untuk empat metrik global; selector `.metrics` tetap dibutuhkan timeline history dan summary Sentinel paralel, sehingga penghapusannya menunggu migrasi seluruh consumer. Portal `StatGrid` tetap merupakan pola editorial berbeda (band statistik tanpa tone/freshness) dan belum digabung paksa; karena kontrak penuh termasuk freshness, katalog menyeluruh, dan bukti layar belum diterima, UI-C07-10/UI-C10-12 serta gate migrasi view tetap terbuka. Katalog diberi fixture operational fabricated. `pnpm --filter @empire/ui typecheck`, `pnpm --filter @empire/command-center typecheck`, serta `pnpm --filter @empire/ui catalog:build` dan `pnpm --filter @empire/command-center build` berhasil; build Command Center memperingatkan chunk 1,368.05 KB melebihi batas 500 KB, dan browser visual review masih harus dilakukan. Dari `WorldMonitorView.tsx` hanya import dan hunk empat metrik global yang di-stage; alerts, history, observations, mapLayers, dan perilaku Sentinel yang berjalan paralel tidak ikut dalam batch.

Koreksi bukti metrik setelah slice UI-C07-10: `StatGrid` lama telah dihapus dan seluruh consumer repo memakai satu `MetricGrid` package dengan profil `editorial` (Portal home) dan `operational` (Command Center overview/Continuum/Directory/CAB/World Monitor). API bersama menerima `value`, `label`, `detail`, `tone`, dan `freshness`; katalog memperlihatkan dua profil plus fixture freshness. Selector grid/item Portal `.stat-grid`/`.stat-item` dan style `.eol-stat-grid*` paralel dihapus; wrapper section `.stat-band` dan aturan brand/theme-nya tetap menjadi komposisi Portal di stylesheet package. Typecheck UI/Portal/Command Center, build katalog, dan production build Command Center lulus; CUA browser review tidak tersedia di Work settings pada sesi ini, sehingga tampilan editorial dan breakpoint belum disetujui secara visual dan matriks C14 tetap terbuka. UI-C07-10 ditutup untuk kontrak dan migrasi kode saja; UI-C10-12, C12-04/C12-16, serta penerimaan visual lintas tema/viewport tetap terbuka.\n\nPembaruan UI-C07-01: pola `Container` kini diekspor melalui `@empire/ui` dengan lebar `reading` (48rem), `content` (76rem), dan `workspace` (90rem), gutter desktop/tablet/mobile berbasis token, dan fixture tiga preset di katalog. Route Portal systems, roadmap, not-found, serta loading memakai komponen; homepage menggunakan class hook `eol-container` pada section untuk mempertahankan semantik elemen dan styling layout. Definisi `.container` beserta override breakpoint-nya di stylesheet Portal dihapus, sehingga sizing sekarang dimiliki `packages/ui/src/patterns/container.css` dan token layout. Typecheck UI/Portal/Command Center, build katalog, serta build Command Center lulus; warning chunk Command Center tetap 1,386.03 KB. `localhost:5173` memberi HTTP 200 dan judul 100CENTER; bukti ini bukan penerimaan visual Portal atau review breakpoint. UI-C07-01 ditutup untuk komponen, preset, token, katalog, dan adopsi Portal; matriks tampilan tetap terbuka.

Pembaruan pola heading Portal: `SectionHeading` package kini menerima layout `section` dan `compact`; empat heading homepage berpindah dari class `.section-head` ke layout package, dan aturan `.section-head` Portal (termasuk breakpoint mobile) dihapus. Katalog memuat judul panjang dengan aksi untuk mengamati wrapping pada lebar sempit. Typecheck UI/Portal/Command Center, build katalog, dan build Command Center lulus; bundle Command Center tetap memberi warning 1,387.23 KB. Selector `.section-head` masih dipakai oleh markup dan CSS Command Center, jadi migrasi lintas-app serta penerimaan visual tetap terbuka; UI-C07-09 tidak dicentang.

## 16. Definisi selesai program

Program selesai ketika seluruh gate wajib dan matriks permukaan diterima, sumber desain paralel sudah dihapus, logo/ikon mempunyai master resmi, dan kedua aplikasi mengonsumsi kontrak yang sama. Pola unik tetap dapat berkembang, tetapi penambahan presentasi baru dilakukan dalam package dengan fixture dan review. Data serta workflow aplikasi tetap dikelola pemilik produknya.

Dokumen ini adalah deliverable perencanaan. Pembuatan SVG final, perubahan komponen, migrasi CSS, pengujian browser, dan penerimaan visual masih merupakan pekerjaan implementasi dalam checklist di atas.
