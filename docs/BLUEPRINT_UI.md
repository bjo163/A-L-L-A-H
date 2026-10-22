# BLUEPRINT UI — EMPIRE OF THE LIGHT

**Versi:** 1.0 · **Tanggal baseline:** 22 Oktober 2026

**Cakupan:** design system `@empire/ui`, portal publik, 100CENTER, serta pola antarmuka untuk modul yang akan berkembang.

**Status:** rencana pengembangan jangka panjang. Centang menunjukkan kondisi yang dapat ditemukan pada kode baseline; rencana lain menunggu implementasi dan bukti. Dokumen ini tidak menyatakan produk sudah operasional atau siap produksi.

## 1. Tujuan dan arah produk

UI harus membantu seseorang memahami apa yang sedang ia lihat, dari mana informasi berasal, apa yang sudah terjadi, apa yang masih usulan, dan tindakan apa yang dapat ia lakukan. Identitas visual Empire of the Light memberi karakter; struktur informasi, aksesibilitas, dan kejelasan keputusan menentukan apakah produk dapat digunakan untuk pekerjaan nyata.

Tujuan jangka panjangnya adalah satu keluarga pengalaman yang konsisten: pengunjung memahami ekosistem melalui portal; peneliti mengumpulkan sumber dan bukti; operator menjalankan pekerjaan; reviewer menilai usulan; pemilik mandat mengambil keputusan; pengelola melihat riwayat dan pemulihan. Kedalaman UI bertambah bersama kemampuan backend dan kesiapan pengguna.

Keberhasilan diukur melalui tugas yang selesai dengan benar, kesalahan yang berkurang, sumber yang dapat diperiksa, akses yang dapat dipahami, dan keputusan yang dapat ditelusuri. Banyaknya komponen, animasi, halaman, atau dashboard tidak menjadi ukuran utama.

## 2. Pembacaan baseline dan masalah yang perlu diselesaikan

| Area | Kondisi yang terlihat pada baseline | Implikasi desain |
| --- | --- | --- |
| Portal | Next.js; halaman utama, systems, roadmap; penjelajah sistem interaktif | Sudah memberi arah visual, perlu pengujian pemahaman, navigasi, dan aksesibilitas |
| 100CENTER | React/Vite; ringkasan kesehatan API dan daftar modul | Alur operasional perlu dibangun bersama autentikasi, otorisasi, dan data persisten |
| Package UI | Button, Panel, Badge, Notice; token CSS awal; dipakai kedua aplikasi | Fondasi tersedia, kontrak komponen dan cakupan token perlu dimatangkan |
| CSS aplikasi | Banyak nilai langsung dan selector global; aturan lokal masih dapat menimpa primitive | Perlu migrasi bertahap agar token bersama menjadi sumber desain yang nyata |
| Status | Maturity penelitian, health, readiness, status modul, dan status pekerjaan memiliki makna berbeda | Setiap jenis status membutuhkan label dan pemetaan tersendiri |
| Interaksi | Penjelajah memakai semantik tab; perilaku keyboard lengkap belum diaudit | Audit keyboard diperlukan sebelum pola tab dipromosikan menjadi komponen bersama |
| Tipografi | Portal mengimpor font eksternal; command center memakai fallback sistem | Strategi font, bahasa, performa, dan fallback perlu diputuskan |
| Isi produk | Blueprint dan metadata lebih matang daripada workflow produk | UI perlu membedakan konten publik, demonstrasi, dan pekerjaan nyata |
| Paket sumber | Package UI diekspor sebagai TypeScript dan ditranspilasi konsumen | Kontrak konsumsi Next/Vite dan batas server/client perlu didokumentasikan |

Masalah utama berikutnya adalah membuat satu perjalanan pengguna yang koheren. Menambah primitive dilakukan ketika perjalanan itu memperlihatkan kebutuhan yang berulang. Sebuah komponen masuk package bersama setelah peran, perilaku, state, dan batas variasinya dapat dijelaskan.

### 2.1 Inventaris antarmuka saat ini

| Aplikasi | Route/area | Isi dan interaksi yang terlihat | Data/interaksi |
| --- | --- | --- | --- |
| Portal | / | Hero, identitas, ringkasan sistem, tujuh plane, Explorer, checkpoint, CTA | Copy statis; Explorer memilih satu sistem secara lokal |
| Portal | /systems | Atlas plane dan registry modul | Metadata statis |
| Portal | /roadmap | Tahapan, readiness table, tautan GitHub | Konten statis yang ditinjau saat build |
| Portal | not-found | Pesan 404 dan jalan kembali | Navigasi ke beranda |
| Portal | root layout | Header, navigasi Ecosystem/Systems/Roadmap/GitHub, footer, metadata | Link lokal dan eksternal |
| Command center | shell | Sidebar dan overview API, Module Registry, Release Gates | Empat permintaan API; health, readiness, modules, capabilities |
| Command center | API boundary | Refresh manual, waktu pemeriksaan, partial/unavailable message | Fetch dengan batas waktu 7 detik |
| Shared package | foundations | Button, Panel, Badge, Notice, tokens, dan katalog Vite | Props lokal; belum mempunyai sistem layout domain |
| Shared package | catalog | Contoh state tombol dan semantic color swatches dengan nama token | Fixture lokal, tanpa koneksi ke data produk |

Inventaris ini hanya memetakan layar yang ada. Halaman portal masih banyak menyajikan data statis; 100CENTER belum menunjukkan alur masuk/izin atau workflow riset persisten. Perbedaan tersebut menentukan urutan fase UI dan tidak boleh disamarkan oleh visualisasi status.

## 3. Prinsip keputusan UI

1. **Tugas pengguna lebih dahulu.** Setiap layar mempunyai pengguna, tujuan, tindakan utama, dan hasil yang jelas.
2. **Status mempunyai arti.** Process health, dependency readiness, module maturity, dan mission completion tidak saling menggantikan.
3. **Sumber dapat diperiksa.** Informasi penting memiliki asal, waktu, versi, konteks, dan batas penggunaan yang relevan.
4. **Keputusan manusia terlihat.** UI menampilkan pengusul, reviewer, pihak berwenang, alasan, dan hasil keputusan sesuai izin.
5. **Konsisten pada fondasi.** Warna semantik, tipografi, focus, kontrol, dan bahasa interaksi dikelola bersama.
6. **Kepadatan sesuai pekerjaan.** Portal dapat ekspresif; layar operasional mengutamakan pemindaian informasi dan akurasi.
7. **Aksesibilitas bagian dari rancangan.** Keyboard, pembaca layar, zoom, kontras, dan gerakan diperiksa sejak awal.
8. **Kesalahan dapat dipulihkan.** UI mempertahankan konteks dan memberi langkah berikutnya yang benar-benar tersedia.
9. **Privasi mengikuti konteks.** Pencarian, notifikasi, ekspor, dan URL tidak membocorkan data yang tidak boleh dilihat.
10. **Kompleksitas diperkenalkan bertahap.** Fitur lanjutan muncul ketika pekerjaan dan kemampuan sistem membutuhkannya.

## 4. Pengguna dan perjalanan utama

| Pengguna | Tujuan | Perjalanan yang perlu dirancang | Bukti keberhasilan |
| --- | --- | --- | --- |
| Pengunjung publik | Memahami tujuan dan kondisi proyek | Masuk portal → pahami identitas → jelajahi sistem → baca status dan roadmap | Dapat menjelaskan tujuan, status nyata, dan langkah berikutnya |
| Pembaca sumber | Mengetahui arti istilah dan asal klaim | Cari istilah → pilih makna → periksa sumber dan konteks → simpan rujukan | Dapat membedakan teks sumber, interpretasi, dan usulan |
| Peneliti | Menyusun pertanyaan dan bukti | Buat ResearchRun → pilih sumber → jalankan pekerjaan → periksa evidence → kirim review | Pertanyaan, versi input, hasil, dan sitasi dapat ditelusuri |
| Operator | Menjalankan pekerjaan yang diizinkan | Masuk → pilih konteks → periksa readiness → jalankan atau pantau tugas → tangani kegagalan | State dan tindakan konsisten dengan hasil API |
| Reviewer | Menilai kelengkapan dan risiko | Buka antrean → periksa perubahan dan bukti → beri alasan → setujui atau kembalikan | Keputusan mempunyai subjek, alasan, cakupan, dan riwayat |
| Steward | Memelihara Journey/Path | Tinjau milestone → lihat perubahan → revisi/suspend/retire → periksa dampak | Perubahan state mengikuti mandat dan kontrak domain |
| Pengelola akses | Mengelola identitas dan mandat | Pilih actor → lihat izin efektif → berikan/revisi/cabut mandat → audit | Pengguna memahami izin efektif dan masa berlakunya |

Role produk ini perlu dikonfirmasi dengan pengguna nyata. Role UI membantu navigasi; otoritas tindakan berasal dari server dan mandat yang berlaku.

## 5. Arsitektur pengalaman dan batas kepemilikan

### 5.1 Tiga lapisan penyusunan

| Lapisan | Pemilik | Isi | Kriteria penempatan |
| --- | --- | --- | --- |
| Foundations dan primitives | `packages/ui` | Token, Button, Panel, Badge, Notice; kontrol dasar yang matang berikutnya | Bebas routing, API, dan makna domain khusus |
| Pola aplikasi | Aplikasi pemakai | Shell, sidebar, navigasi, tata letak daftar/detail, penanganan sesi | Terikat cara aplikasi bekerja dan platform yang digunakan |
| Fitur domain | Aplikasi/modul pemilik kemampuan | ResearchRun, evidence viewer, approval, Journey/Path | Memerlukan kontrak data, izin, dan lifecycle domain |

Pola gabungan dapat dipindahkan ke package UI setelah kebutuhan lintas aplikasi terbukti dan API-nya stabil. Pemisahan package baru membutuhkan alasan kepemilikan atau dependensi yang jelas; jumlah package tidak dijadikan target.

### 5.2 Struktur target bertahap

```text
packages/ui/
  package.json
  README.md
  tsconfig.json
  src/
    index.ts                 # API publik yang sudah stabil
    styles.css               # entry CSS publik
    tokens/                  # muncul ketika token dipisah dari styles.css
    primitives/              # kontrol dan elemen dasar
    patterns/                # komposisi yang terbukti lintas aplikasi
  ...                        # katalog/contoh mengikuti keputusan tooling

apps/portal/
  app/                       # route dan layout Next.js
  components/                # komposisi editorial dan portal

apps/command-center/
  src/
    ...                      # shell dan fitur diatur saat alur pertama dibangun

docs/BLUEPRINT_UI.md          # rencana dan checklist UI utama
```

Struktur target ini diperkenalkan saat ada isinya. Jangan membuat direktori kosong untuk semua kemungkinan fitur. Root repository menyimpan konfigurasi workspace, dokumentasi pengantar, dan lockfile; source serta keluaran build mengikuti direktori pemiliknya.

### 5.3 Kontrak package UI

- Komponen menerima data tampilan melalui props dan meneruskan atribut HTML yang relevan.
- Routing tetap menggunakan kemampuan aplikasi; styling action link harus mendukung Next Link dan anchor biasa.
- Package tidak melakukan fetch, membaca secret, menentukan tenant, atau memutuskan izin.
- CSS memakai namespace `eol-` dan token `--eol-*`; perubahan tidak mereset seluruh halaman konsumen.
- Komponen yang perlu state, efek, atau browser API memiliki batas client yang jelas untuk Next.js.
- Tipe React, peer dependency, dan cara transpile konsumen dipelihara sebagai kontrak package.
- Perubahan API mempunyai contoh migrasi dan diperiksa pada kedua aplikasi.
- Komponen stabil diekspor melalui entry publik; aplikasi tidak mengimpor file internal secara langsung.

## 6. Fondasi visual dan bahasa desain

### 6.1 Identitas

Karakter visual awal adalah ruang gelap, aksen cahaya cyan/mint, garis presisi, serta penanda emas untuk perhatian. Bahasa bentuk dapat mengambil inspirasi orbit, jaringan, dan lapisan sistem. Pada layar tugas, ornamen ditempatkan agar tidak mengganggu pembacaan, hirarki, dan tindakan.

Identitas brand, indikator interaksi, dan status semantik memerlukan token berbeda. Warna emas untuk elemen brand tidak otomatis berarti warning; badge penelitian tidak otomatis berarti proses bermasalah. Label teks selalu menjelaskan status.

### 6.2 Sistem token

| Kelompok | Contoh kontrak yang dituju | Pemakaian |
| --- | --- | --- |
| Warna dasar | palette neutral, cyan, amber, green, red | Bahan penyusun; penggunaan langsung dibatasi pada definisi token |
| Warna semantik | background, surface, text, muted, border, focus, action | Kebutuhan antarmuka lintas aplikasi |
| Status | info, success, warning, danger, pending, unavailable | Presentasi status dengan teks yang sesuai domain |
| Tipografi | font body/display/mono; size, weight, line-height | Isi, judul, angka, kode, dan metadata |
| Spasi | skala konsisten dan jarak berdasarkan fungsi | Kontrol, panel, section, grid |
| Ukuran | control height, reading width, sidebar width | Konsistensi interaksi dan keterbacaan |
| Bentuk | radius, border width, elevation | Surface dan hirarki lapisan |
| Gerakan | durasi, easing, reduced motion | Feedback dan perubahan state |
| Lapisan | menu, popover, dialog, notification | Menghindari benturan z-index |
| Kepadatan | comfortable dan compact bila dibutuhkan | Membaca konten dan mengelola data padat |

Setiap token memiliki nama, tujuan, nilai, contoh, dan larangan penggunaan bila diperlukan. Alias CSS aplikasi yang lama dimigrasikan bertahap ke token semantik, dengan pengecekan visual per halaman.

### 6.3 Kontrak komponen

Setiap komponen baru harus mendeskripsikan tujuan, anatomi, props, variasi, state, perilaku keyboard, focus, pembaca layar, batas responsif, serta contoh penggunaan yang benar dan keliru. Ukuran dan variasi ditambahkan berdasarkan tugas yang diketahui.

Untuk kontrol interaktif, definisikan default, hover, focus-visible, active, disabled, loading, error, dan success yang relevan. Untuk komponen data, definisikan initial, loading, empty, partial, stale, error, dan unavailable. Kontrak tidak mengharuskan setiap komponen mempunyai semua state tersebut.

## 7. Arsitektur informasi produk

### 7.1 Portal publik

Navigasi awal berpusat pada tujuan proyek, systems, roadmap/readiness, dan sumber publik. Penambahan knowledge explorer, publikasi riset, atau laporan evidence menunggu konten yang telah ditinjau dan kontrak publikasinya.

Setiap halaman mempunyai satu tujuan, judul yang dapat dipahami, ringkasan, isi dengan hirarki yang jelas, rujukan, dan langkah berikutnya. Informasi penelitian membedakan rencana, simulasi, eksperimen, hasil pengukuran, dan validasi independen sesuai bukti yang tersedia.

### 7.2 100CENTER

Navigasi operasional dibentuk dari pekerjaan: overview, research, jobs, evidence, review, journeys/missions, dan administration. Hanya bagian yang telah siap secara produk dan izin yang menjadi navigasi aktif. Daftar modul dapat tetap memperlihatkan kesiapan kemampuan tanpa menyajikannya sebagai tugas yang dapat dijalankan.

Shell menampilkan konteks workspace/tenant, identitas pengguna, pencarian yang sesuai scope, status koneksi, dan tindakan yang relevan. Penggantian konteks memuat ulang data dan izin; label konteks terlihat pada layar detail dan tindakan berdampak.

### 7.3 Kontrak daftar dan detail

- Daftar menjawab apa yang tersedia, state, pemilik, perubahan terakhir, dan tindakan berikutnya.
- Filter, sort, pencarian, pagination, dan selected state didefinisikan bersama perilaku URL.
- Detail memperlihatkan identitas objek, status, ringkasan, bukti, riwayat, dan tindakan sesuai izin.
- Kembali ke daftar mempertahankan filter dan posisi yang relevan.
- Link langsung memiliki loading, not-found, forbidden, dan objek yang telah berubah state.

## 8. Status, provenance, dan interaksi yang jujur

| Jenis | Contoh | Aturan UI |
| --- | --- | --- |
| Konektivitas | connecting, offline, reconnecting | Pisahkan dari hasil domain; tampilkan waktu data terakhir |
| Health | checking, ok, unavailable | Menjelaskan respons proses yang dipantau |
| Readiness | ready, degraded, blocked | Menjelaskan kemampuan dependensi untuk menjalankan tugas |
| Maturity | proposal, research, scaffold, pilot, operational | Tampilkan dasar klaim dan waktu peninjauan |
| Pekerjaan | queued, running, succeeded, failed, cancelled | Gunakan lifecycle API; jangan menampilkan persen tanpa dasar |
| Review | draft, submitted, changes requested, approved, rejected | Tampilkan reviewer, alasan, dan versi yang ditinjau |
| Kesegaran | current, stale, unknown | Sertakan sumber waktu dan aturan refresh |

Warna disertai label, dan bila bermanfaat ikon atau pola bentuk. Tidak ada badge tunggal yang menjamin keseluruhan sistem aman atau operasional. Hasil pencarian kosong, akses ditolak, API gagal, dan data belum tersedia mempunyai pesan serta tindakan yang berbeda.

Provenance viewer perlu menampilkan identitas sumber, edition/witness, bahasa, terjemahan, lisensi, referensi bagian, waktu pengambilan, dan hubungan dengan klaim ketika tersedia. Perbandingan tradisi mempertahankan konteks masing-masing sumber. Ketidakpastian dinyatakan dengan bahasa yang dapat dipahami dan bukti pendukung.

## 9. Horizon kerja dan ketergantungan

Horizon merupakan urutan kematangan, bukan janji kalender. Satu tahap ditutup berdasarkan bukti. Durasi baru diestimasi ketika cakupan, kapasitas, data, dan pemilik pekerjaan telah diketahui.

| Horizon | Fase | Hasil yang dituju | Ketergantungan utama |
| --- | --- | --- | --- |
| H0: fondasi | U00–U03 | Arah produk, token, primitive, katalog dan aksesibilitas dasar | Audit kode dan tugas pengguna |
| H1: pengalaman pertama | U04–U06 | Portal matang, shell operasional, alur research/evidence pertama | Kontrak publikasi, identity, izin, dan API yang disetujui |
| H2: kedalaman domain | U07–U10 | Review, knowledge, Journey/Mission, administrasi | Data persisten, provenance, mandat, audit |
| H3: kualitas lintas konteks | U11–U13 | Bahasa, perangkat, performa, pengukuran dan rilis | Pengguna pilot dan workflow stabil |
| H4: pertumbuhan | U14 | Ekstensibilitas modul dan pengalaman riset lanjut | Kebutuhan nyata serta kesiapan tiap domain |

U11–U13 berisi pekerjaan lintas fase. Dasar aksesibilitas, responsif, performa, dan kualitas dimulai pada H0; fase tersebut memperluas cakupan serta bukti setelah alur nyata tersedia.

## 10. Cara menjalankan checklist

- `[ ]` berarti belum selesai atau bukti belum cukup. `[x]` berarti hasil sudah tersedia dan dapat diperiksa.
- ID seperti `UI-U02-03` tetap dipakai dalam issue, perubahan kode, catatan keputusan, dan bukti.
- Satu item dapat memiliki beberapa subtask di issue, tetapi status penyelesaian utama berada di dokumen ini.
- Task aktif mencatat pemilik, scope, dependensi, hasil, dan bukti. Pemilik di bawah adalah peran yang perlu diisi, bukan penugasan orang.
- Item yang dibatalkan tetap dicatat dengan alasan dan tanggal; jangan menandainya selesai seolah telah diimplementasikan.
- Gate fase memerlukan bukti tersendiri. Selesainya beberapa komponen tidak otomatis menutup fase.
- Gunakan fixture yang jelas berlabel saat backend belum tersedia; ubah status integrasi setelah menggunakan layanan dan data yang nyata.

## 11. Checklist utama jangka panjang

### U00 — Baseline, kepemilikan, dan pengendalian scope

**Pemilik yang dibutuhkan:** product owner, maintainer frontend. **Gate:** ruang lingkup UI dan sumber kebenaran backlog dapat dipahami oleh kontributor baru.

- [x] **UI-U00-01** — Sediakan `packages/ui` sebagai workspace `@empire/ui`.
- [x] **UI-U00-02** — Hubungkan dependensi dan stylesheet package dengan portal serta command center.
- [x] **UI-U00-03** — Dokumentasikan batas package UI dan komposisi aplikasi dalam README package.
- [x] **UI-U00-04** — Sediakan blueprint dan checklist UI utama dalam dokumen ini.
- [x] **UI-U00-05** — Inventaris route, area, interaksi utama, dan sifat sumber data portal serta command center di tabel audit awal.
- [ ] **UI-U00-06** — Catat owner aktual untuk design system, portal, command center, accessibility, dan konten.
- [ ] **UI-U00-07** — Buat daftar keputusan desain terbuka, alasan, alternatif, dan status keputusan.
- [ ] **UI-U00-08** — Tetapkan aturan perubahan scope dan definisi selesai untuk pekerjaan UI.

### U01 — Penelitian pengguna dan rancangan perjalanan

**Pemilik yang dibutuhkan:** product/design, perwakilan pengguna. **Gate:** satu alur prioritas telah dirancang dan ditinjau dengan pengguna yang sesuai.

- [ ] **UI-U01-01** — Konfirmasi tujuan utama pengunjung portal dan operator awal melalui percakapan atau observasi.
- [ ] **UI-U01-02** — Dokumentasikan tugas, konteks penggunaan, frekuensi, risiko kesalahan, dan kebutuhan akses tiap pengguna.
- [ ] **UI-U01-03** — Pilih satu alur pertama portal dan satu calon alur operasional berdasarkan nilai serta kesiapan sistem.
- [ ] **UI-U01-04** — Buat sitemap portal dan model navigasi 100CENTER berdasarkan tugas.
- [ ] **UI-U01-05** — Buat wireframe alur prioritas untuk desktop dan layar sempit.
- [ ] **UI-U01-06** — Petakan happy path, loading, empty, error, forbidden, dan pemulihan pada alur tersebut.
- [ ] **UI-U01-07** — Uji pemahaman istilah brand, label navigasi, maturity, readiness, dan evidence.
- [ ] **UI-U01-08** — Catat temuan, perubahan desain, dan kriteria keberhasilan tugas sebelum implementasi diperluas.

### U02 — Fondasi visual dan token yang dapat dipelihara

**Pemilik yang dibutuhkan:** design system, frontend. **Gate:** halaman prioritas memakai token yang terdokumentasi dan tampil konsisten pada kedua aplikasi.

- [x] **UI-U02-01** — Sediakan token awal warna, spasi, radius, dan font dengan namespace `--eol-*`.
- [ ] **UI-U02-02** — Audit seluruh warna dan nilai langsung; pisahkan kebutuhan brand, interaksi, serta status.
- [x] **UI-U02-03** — Tentukan hirarki token palette, semantik, status, dan aplikasi; dokumentasikan namespace serta pemakaiannya.
- [x] **UI-U02-04** — Tetapkan skala tipografi dasar untuk isi, metadata, serta angka; skala display lengkap masih mengikuti review aplikasi.
- [x] **UI-U02-05** — Pilih strategi distribusi font, fallback, lisensi, dukungan karakter, dan biaya pemuatannya.
- [x] **UI-U02-06** — Tetapkan ukuran kontrol, reading/workspace/sidebar width, skala spasi, elevation, serta lapisan overlay.
- [x] **UI-U02-07** — Tetapkan default motion, reduced motion, ukuran dan stroke ikon; pola ornamen tetap milik aplikasi.
- [ ] **UI-U02-08** — Migrasikan CSS halaman prioritas ke token sambil mengurangi selector global yang menimpa primitive.
- [ ] **UI-U02-09** — Putuskan kebutuhan tema tambahan dan density berdasarkan pengguna; catat tema yang didukung resmi.
- [ ] **UI-U02-10** — Lampirkan bukti kontras, zoom, dan perbandingan visual dari kedua aplikasi.

#### Audit warna awal (berjalan)

| Konteks | Keputusan saat ini | Batas audit |
| --- | --- | --- |
| Canvas, teks, teks sekunder, fokus, aksen, aksi utama, gold, dan border netral | Gunakan token semantik `@empire/ui` untuk canvas/foreground root, focus ring, link, action, health/readiness, dan status; warna struktur aplikasi yang belum dimigrasikan tetap lokal. Portal memetakan warna teks, fokus, action, dan border struktur ke token yang sama. | Periksa ulang seluruh route serta state kontras/focus pada viewport sempit dan zoom. |
| Status | Label kematangan portal dan health/readiness command center memakai teks plus Badge/status token. | Warna status harus tetap terpisah dari accent dan warna identity. |
| Identitas sistem | Enam `accent` di data Explorer dan empat aksen kelas plane (`amber`, `violet`, `rose`, `mint`) adalah identitas per sistem, bukan severity/status. Aksen Explorer disalurkan sebagai `--system-color`; default-nya memakai token accent. | Tinjau contrast pada setiap kombinasi warna dan konten aktual. |
| Surface lokal dan ilustrasi | Surface dasar portal memakai background/surface/inset tokens; sigil brand, orbit, bintang, glow, transparansi, dan ilustrasi tetap didefinisikan lokal. | Snapshot audit 22 Oktober 2026: 131 kemunculan literal hex (121 unik) tersisa di `globals.css`; 18 kemunculan (17 unik) berada dalam selector tema terang dan merupakan glow, ilustrasi, transparansi, atau artwork. Surface statistik, identitas, section, kartu frontier, alur, atlas, navigasi mobile, serta garis header kini memakai token semantik. Review route dan kontras artwork/overlay belum ditutup. |
| Metadata browser | `theme-color` HTML memakai warna canvas yang sama, karena metadata browser tidak dapat membaca CSS variable. Katalog memperbarui nilai meta dari `--eol-color-background` saat preview tema diganti; Command Center tetap memakai nilai gelap statis sesuai tema yang didukung. | Pastikan metadata app ikut diubah jika kebijakan tema aplikasi berubah. |

Snapshot audit stylesheet 22 Oktober 2026 menemukan 18 literal hex (16 unik) di Command Center `style.css` dan 131 literal (121 unik) di Portal `globals.css`. Command Center mempertahankan literal yang tersisa untuk artwork/glow Hero; Portal mempertahankan artwork, transparansi, dan glow sesuai keputusan di atas. Nilai semantik dan state interaksi baru harus memakai token. Kedua stylesheet masih memerlukan audit selector dan route sebelum UI-U02-02/08 ditutup. Item UI-U02-02 tetap terbuka sampai seluruh nilai tersisa dan route prioritas ditinjau terhadap konteks rendering, bukan sekadar dihitung.

#### Keputusan awal tema dan density (sementara)

| Keputusan | Status | Alasan dan alternatif | Kondisi tinjau ulang |
| --- | --- | --- | --- |
| Tema resmi `@empire/ui` | Dark sebagai default; palette semantic light tersedia di @empire/ui dan switch Portal aktif, tetapi masih provisional sampai audit kontras/route selesai. | Dark tetap default package. Portal menyediakan switch persisten dan package kini memiliki semantic token light; Command Center tetap dark. Katalog package menyediakan preview untuk kedua palette. Palette light memenuhi kalkulasi token awal dan tiga route prioritas Portal telah diperiksa secara visual pada desktop. Kontras setiap overlay/artwork, layar sempit, zoom, Command Center, dan high contrast belum ditinjau; alternatifnya tetapkan light resmi lintas aplikasi setelah review aksesibilitas dan kebutuhan pengguna. | Riset pengguna meminta tema terang, audit aksesibilitas menemukan hambatan yang tidak dapat diselesaikan dalam tema gelap, atau kebutuhan sistem operasi menuntutnya. |
| Density resmi | Comfortable/default saja; belum ada mode compact | Portal bersifat editorial dan Command Center tahap awal belum mempunyai tabel data padat yang tervalidasi. Alternatif: density compact untuk layar operator setelah diukur. | Pilot menunjukkan pemindaian data padat atau viewport kerja membutuhkan compact density; ukur keterbacaan dan target sentuh sebelum menambah token/varian. |

Keputusan ini merupakan baseline implementasi sementara berdasarkan konsumen yang ada, bukan hasil riset pengguna. Karena item UI-U02-09 mensyaratkan dasar pengguna, checklist tetap terbuka sampai kondisi tinjau tersebut mendapat bukti.

Snapshot audit theme terbaru: `apps/portal/app/globals.css` memiliki 131 literal hex (121 unik). Foreground, fokus, aksen, status, surface konten prioritas, state hover, navigasi portal, dan kontrol bahasa yang jelas dipetakan ke token semantik. Nilai yang tersisa mencakup gradient, shadow, opacity overlay, aksen identitas visual, dan selector khusus route yang masih perlu ditinjau. `apps/command-center/src/style.css` memiliki 18 literal hex (16 unik), terutama glow/ornamen; metadata `theme-color` memakai warna canvas yang sama.

### U03 — Komponen dasar, katalog, dan kontrak aksesibilitas

**Pemilik yang dibutuhkan:** design system, frontend, accessibility. **Gate:** komponen prioritas mempunyai dokumentasi state dan dapat digunakan dengan keyboard pada kedua konsumen.

- [x] **UI-U03-01** — Sediakan Button, Panel, Badge, Notice, serta helper kelas action sebagai baseline.
- [x] **UI-U03-02** — Dokumentasikan kontrak props, variasi, semantik, state, dan batas primitive awal; ref/size belum menjadi API.
- [x] **UI-U03-03** — Sediakan katalog Vite lokal untuk primitive UI dan build-nya.
- [x] **UI-U03-04** — Tambahkan TextField, TextArea, Label, HelpText, dan FieldError ketika form pertama membutuhkannya.
- [ ] **UI-U03-05** — Tambahkan checkbox, radio, switch, dan select dengan semantik serta perilaku native yang sesuai. `SelectField` native dan `Switch` controlled tersedia; switch dipakai Portal untuk tema. Checkbox/radio masih menunggu form nyata yang memerlukannya.
- [x] **UI-U03-06** — Sediakan EmptyState, LoadingState, Skeleton, dan ErrorState berdasarkan pola tugas nyata.
- [x] **UI-U03-07** — Matangkan Tabs dengan roving focus, arrow keys, Home/End, serta hubungan tab-panel.
- [x] **UI-U03-08** — Tambahkan dialog/drawer dengan focus management, Escape, label, dan pengembalian focus yang benar.
- [ ] **UI-U03-09** — Tambahkan menu, popover, tooltip, toast, dan progress hanya saat pemakaian pertama telah dirancang.
- [x] **UI-U03-10** — Dokumentasikan batas server/client, import publik, CSS, peer dependency React 19, dan konsumsi Next/Vite.
- [x] **UI-U03-11** — Pastikan teks panjang, konten kosong, beberapa notifikasi, dan tema yang didukung tidak merusak komponen.
- [ ] **UI-U03-12** — Tambahkan pemeriksaan interaksi yang bermakna untuk kontrol kompleks; lampirkan hasil keyboard dan pembaca layar.

Adopsi nyata U03-06: Command Center memakai `LoadingState`, `EmptyState`, dan `ErrorState` pada daftar Module Registry, RFC, dan Research Run. Keadaan gagal menyediakan aksi muat ulang; hasil kosong hanya ditampilkan setelah pemuatan berhasil. Typecheck dan build kedua konsumen berhasil setelah adopsi.

Catatan U03-11: CSS primitive membungkus identifier panjang pada Notice, state, Badge, tombol, dan dialog; tablist membungkus item saat ruang menyempit. Katalog memuat identifier tanpa spasi, beberapa state kosong, dan tumpukan Notice. Contoh Notice statis memakai role `note`; LoadingState fixture menonaktifkan live announcement saat halaman dimuat. Tombol katalog menambahkan satu role `status` atau `alert` secara interaktif. Review browser pada viewport 375 px mengonfirmasi teks identifier dan label tab membungkus tanpa meluapkan panel; navigasi Tab, ArrowRight, dan End juga memindahkan fokus/seleksi seperti yang diharapkan. Pemeriksaan reflow setara zoom 200% memakai lebar 308 px (separuh viewport default 617 px) menemukan dan memperbaiki `min-width: 320px` pada body katalog serta minimum kolom token 190 px; sesudah perbaikan, lebar dokumen 293 px sama dengan lebar client 293 px dan tidak ada elemen turunan yang overflow, termasuk tombol preview baru. Cakupan ini untuk tema gelap resmi; forced colors, zoom aktual, dan pengumuman pembaca layar tetap dicatat di item aksesibilitas terkait.

Pematangan hit area Tabs (22 Oktober 2026): primitive kini menerapkan minimum 44 px dari `--eol-control-size-md` beserta padding horizontal/vertikal token. Override padding katalog yang duplikat dihapus. Portal Explorer mempertahankan padding tata letak yang lebih besar dan minimum 76–80 px sesuai breakpoint; kontrak keyboard dan panel tidak berubah.

Catatan verifikasi aksesibilitas kontrol: accessibility tree saat dialog terbuka menampilkan dialog berjudul dan dua tombol bernama. Browser review menemukan Tab dari tombol terakhir sempat keluar ke halaman; `ConfirmDialog` kini membatasi Tab/Shift+Tab ke kontrol dialog. Uji ulang memastikan siklus Batal → Confirm example → Batal, Escape menutup dialog, dan fokus kembali ke tombol pembuka. Ini bukti keyboard/browser, bukan pengganti review pembaca layar.

Catatan U03-12: accessibility tree awal katalog tidak lagi memiliki sample alert/status statis dari galeri Notice; klik tombol preview menambahkan satu node `status` atau `alert` dan browser AX tree memaparkan teks barunya. Ini memeriksa struktur DOM/AX dan perilaku render, belum memverifikasi apa yang diumumkan atau urutan pengumuman melalui pembaca layar.

### U04 — Portal publik yang matang

**Pemilik yang dibutuhkan:** portal frontend, content/design. **Gate:** pengguna dapat memahami tujuan, menelusuri sistem, dan membedakan rencana dengan kemampuan yang tersedia.

- [ ] **UI-U04-01** — Audit halaman utama, systems, roadmap, dan not-found terhadap tujuan halaman.
- [ ] **UI-U04-02** — Rapikan hirarki hero, istilah produk, penjelasan singkat, dan tindakan utama.
- [ ] **UI-U04-03** — Selesaikan navigasi mobile, skip link, active route, anchor focus, dan link eksternal.
- [ ] **UI-U04-04** — Matangkan penjelajah sistem: keyboard, selected state, label status, isi, dan layout sempit.
- [ ] **UI-U04-05** — Definisikan model konten publik untuk sistem, roadmap, maturity, rujukan, dan waktu peninjauan.
- [ ] **UI-U04-06** — Tetapkan alur peninjauan dan publikasi konten beserta owner dan riwayat revisi.
- [ ] **UI-U04-07** — Periksa metadata halaman, social preview, judul dokumen, struktur heading, dan isi 404.
- [ ] **UI-U04-08** — Audit ornamen, font, aset, dan animasi terhadap keterbacaan serta performa perangkat rendah.
- [ ] **UI-U04-09** — Uji tugas menemukan status proyek, memahami satu sistem, dan menemukan sumber pendukung.
- [ ] **UI-U04-10** — Tutup masalah prioritas dari review mobile, keyboard, pembaca layar, dan pemahaman konten.

### U05 — Shell 100CENTER, identitas, dan konteks kerja

**Pemilik yang dibutuhkan:** frontend operasional, identity/API owner. **Gate:** pengguna pilot dapat masuk, mengenali konteks dan izin, lalu mencapai tugas pertamanya.

- [ ] **UI-U05-01** — Rancang sidebar, topbar, breadcrumbs, judul halaman, dan pola tindakan utama.
- [ ] **UI-U05-02** — Integrasikan session loading, signed out, signed in, expired, forbidden, dan sign out dengan identity yang dipilih.
- [ ] **UI-U05-03** — Tampilkan konteks workspace/tenant dan tetapkan perilaku aman saat berpindah konteks.
- [ ] **UI-U05-04** — Bentuk navigasi dari kemampuan yang tersedia dan izin server; jelaskan tindakan yang belum dapat dipakai bila relevan.
- [ ] **UI-U05-05** — Pisahkan health, readiness, connectivity, freshness, dan module maturity dalam overview.
- [ ] **UI-U05-06** — Sediakan pola daftar/detail, filter URL, pagination, dan pemulihan konteks daftar.
- [ ] **UI-U05-07** — Definisikan perilaku polling, retry, refresh manual, dan indikator data lama.
- [ ] **UI-U05-08** — Sediakan error boundary aplikasi, request reference, serta langkah pemulihan yang dapat dijalankan.
- [ ] **UI-U05-09** — Periksa layout desktop, tablet, layar sempit, zoom, dan navigasi keyboard shell.
- [ ] **UI-U05-10** — Uji perpindahan izin/sesi ketika halaman sedang terbuka dan ketika permintaan masih berjalan.

### U06 — Alur ResearchRun → Job → Evidence pertama

**Pemilik yang dibutuhkan:** research product, frontend, canonical API owner. **Gate:** satu tugas nyata memiliki input, hasil persisten, bukti, riwayat, dan penanganan kegagalan.

- [ ] **UI-U06-01** — Sepakati kontrak input, ID objek, state, error, pagination, serta link evidence dengan pemilik API.
- [ ] **UI-U06-02** — Rancang form pertanyaan riset, tujuan, batas sumber, scope, dan lampiran yang dibutuhkan.
- [ ] **UI-U06-03** — Buat review sebelum submit yang menjelaskan input, cakupan, serta pihak yang bertanggung jawab.
- [ ] **UI-U06-04** — Hubungkan daftar/detail ResearchRun dengan state persisted dan deep link.
- [ ] **UI-U06-05** — Tampilkan job queued/running/succeeded/failed/cancelled sesuai kontrak backend.
- [ ] **UI-U06-06** — Tangani duplicate submit, retry, refresh browser, timeout, dan job yang selesai saat halaman ditutup.
- [ ] **UI-U06-07** — Bangun evidence list/detail dengan sumber, versi input, waktu, dan status peninjauan.
- [ ] **UI-U06-08** — Bedakan hasil alat, ringkasan AI, interpretasi, dan keputusan reviewer pada hasil riset.
- [ ] **UI-U06-09** — Hubungkan riwayat aktivitas dengan event yang dapat diakses pengguna dan izin yang berlaku.
- [ ] **UI-U06-10** — Tinjau satu alur lengkap bersama pengguna pilot; catat kesalahan, waktu tugas, dan titik kebingungan.

### U07 — Review, persetujuan, dan tanggung jawab manusia

**Pemilik yang dibutuhkan:** governance product, frontend, authorization owner. **Gate:** reviewer dapat mengambil keputusan atas versi objek tertentu dan hasilnya dapat ditelusuri.

- [ ] **UI-U07-01** — Rancang antrean review berdasarkan prioritas, pemilik, usia, status, dan konflik penugasan.
- [ ] **UI-U07-02** — Buat ringkasan usulan, perubahan dari versi sebelumnya, serta evidence yang mendasarinya.
- [ ] **UI-U07-03** — Tampilkan hak reviewer, cakupan mandat, masa berlaku, dan batas keputusan.
- [ ] **UI-U07-04** — Sediakan approve, request changes, reject, dan alasan yang mengikuti kontrak domain.
- [ ] **UI-U07-05** — Tangani stale revision, keputusan bersamaan, izin berubah, serta objek yang sudah diputuskan.
- [ ] **UI-U07-06** — Rancang konfirmasi tindakan berdampak dengan identitas objek, konsekuensi, dan opsi pemulihan.
- [ ] **UI-U07-07** — Tampilkan riwayat keputusan, konsultasi, perbedaan pendapat, dan jalur banding sesuai scope.
- [ ] **UI-U07-08** — Bedakan rekomendasi AI dengan keputusan final yang dilakukan actor berwenang.

### U08 — UNILEX, knowledge, dan pembacaan sumber

**Pemilik yang dibutuhkan:** knowledge product, content/source owner, frontend. **Gate:** pengguna dapat menemukan istilah atau evidence dan memeriksa konteks sumbernya.

- [ ] **UI-U08-01** — Rancang pencarian istilah dan sumber beserta scope, filter, hasil kosong, serta kegagalan.
- [ ] **UI-U08-02** — Buat tampilan istilah yang memisahkan makna, terjemahan, penggunaan, dan disambiguasi.
- [ ] **UI-U08-03** — Buat provenance panel untuk source family, edition, witness, referensi, bahasa, dan lisensi.
- [ ] **UI-U08-04** — Tampilkan teks sumber, terjemahan, interpretasi, histori, dan proposal dengan label yang jelas.
- [ ] **UI-U08-05** — Rancang perbandingan sumber berdampingan yang mempertahankan konteks, penomoran, dan atribusi.
- [ ] **UI-U08-06** — Periksa rendering teks Arab/RTL, aksara campuran, diakritik, font fallback, dan selection/copy.
- [ ] **UI-U08-07** — Dukung sitasi/deep link yang stabil serta pemberitahuan sumber berubah atau akses tidak tersedia.
- [ ] **UI-U08-08** — Hubungkan klaim dengan evidence dan ketidakpastian tanpa menyatukan perbedaan tradisi secara otomatis.
- [ ] **UI-U08-09** — Tentukan perilaku highlight, konteks sekitar kutipan, serta ekspor sesuai izin dan lisensi.
- [ ] **UI-U08-10** — Tinjau pengalaman dengan reviewer bahasa dan sumber yang relevan sebelum perluasan korpus.

### U09 — Journey, Path, Mission, dan koordinasi

**Pemilik yang dibutuhkan:** journey/mission product, frontend, domain owner. **Gate:** pengguna dapat memahami state, tanggung jawab, milestone, dan perubahan pada satu lifecycle yang disetujui.

- [ ] **UI-U09-01** — Rancang daftar/detail Journey, Path, dan Mission dengan pembedaan istilah yang konsisten.
- [ ] **UI-U09-02** — Tampilkan SELF/COMMUNITY/GLOBAL sesuai scope akses dan privasi data.
- [ ] **UI-U09-03** — Visualisasikan milestone dan timeline dengan alternatif daftar yang dapat diakses.
- [ ] **UI-U09-04** — Buat rancangan transisi DRAFT → RESEARCHING → REVIEW → PILOT → ACTIVE sesuai kontrak domain.
- [ ] **UI-U09-05** — Rancang revisi, pemeliharaan, suspend, resume bila didukung, dan retire beserta alasan serta dampaknya.
- [ ] **UI-U09-06** — Tampilkan actor penanggung jawab, steward, assignment, masa berlaku mandat, dan evidence.
- [ ] **UI-U09-07** — Integrasikan consent, risk review, dan persetujuan yang diperlukan sebelum aktivasi.
- [ ] **UI-U09-08** — Tampilkan persona dan department sebagai informasi organisasi yang berbeda dari izin actor.
- [ ] **UI-U09-09** — Sediakan riwayat versi dan perbandingan perubahan Path/Mission.
- [ ] **UI-U09-10** — Uji pemahaman lifecycle dan penanganan penolakan server dengan pengguna yang sesuai.

### U10 — Modul, administrasi, audit, dan pengaturan

**Pemilik yang dibutuhkan:** platform product, frontend, identity/module owner. **Gate:** operator memahami kemampuan dan izin efektif serta dapat menjalankan tindakan admin yang sudah didukung server.

- [ ] **UI-U10-01** — Matangkan katalog modul: owner, versi, dependency, capability, maturity, dan alasan ketidaksiapan.
- [ ] **UI-U10-02** — Rancang detail konfigurasi di konteks pengaturan yang ditetapkan spesifikasi modul.
- [ ] **UI-U10-03** — Hubungkan install/enable/disable/upgrade hanya setelah lifecycle dan persistence tersedia.
- [ ] **UI-U10-04** — Tampilkan rencana perubahan dependency, persetujuan, migration status, dan rollback yang didukung.
- [ ] **UI-U10-05** — Rancang actor, peran, mandat, izin efektif, masa berlaku, dan revocation.
- [ ] **UI-U10-06** — Bangun audit viewer dengan actor, waktu, konteks, objek, hasil, dan filter yang diizinkan.
- [ ] **UI-U10-07** — Bedakan audit domain, log teknis, dan notifikasi pengguna pada tampilan serta hak aksesnya.
- [ ] **UI-U10-08** — Rancang pengaturan akun, bahasa, zona waktu, notifikasi, dan density sesuai kebutuhan pengguna.
- [ ] **UI-U10-09** — Definisikan ekspor, redaction, retention, dan pencabutan akses terhadap data sensitif.
- [ ] **UI-U10-10** — Uji perubahan admin bersamaan, kegagalan sebagian, pembatalan, dan rollback yang tersedia.

### U11 — Aksesibilitas, bahasa, perangkat, dan situasi jaringan

**Pemilik yang dibutuhkan:** accessibility, design, frontend, reviewer bahasa. **Gate:** perjalanan utama memiliki bukti penggunaan di kondisi pengguna yang ditetapkan.

- [ ] **UI-U11-01** — Tetapkan target aksesibilitas proyek, matriks perangkat/browser, dan metode review yang disepakati.
- [ ] **UI-U11-02** — Audit semua alur utama dengan keyboard, focus order, skip navigation, dan focus restoration.
- [ ] **UI-U11-03** — Audit nama/role/state, live region, heading, label form, dan pesan error dengan pembaca layar.
- [ ] **UI-U11-04** — Periksa kontras, zoom, reflow, target sentuh, forced colors, dan reduced motion.
- [ ] **UI-U11-05** — Tetapkan strategi Indonesia/Inggris, glosarium istilah, tanggal, angka, dan jam/zona waktu.
- [ ] **UI-U11-06** — Periksa teks panjang, translasi yang meluas, RTL, dan isi multiaksara pada komponen serta layout.
- [ ] **UI-U11-07** — Rancang jaringan lambat, koneksi putus, reconnect, data stale, dan draft yang belum tersimpan.
- [ ] **UI-U11-08** — Tentukan fungsi yang benar-benar perlu mobile, tablet, atau desktop; dokumentasikan batas perangkat.
- [ ] **UI-U11-09** — Prioritaskan dan tutup temuan berdasarkan dampak terhadap tugas pengguna.

### U12 — Performa, pengukuran pengalaman, dan kualitas implementasi

**Pemilik yang dibutuhkan:** frontend/platform, product analytics. **Gate:** alur prioritas memenuhi anggaran yang disepakati dengan bukti pada data dan perangkat yang representatif.

- [ ] **UI-U12-01** — Ukur baseline waktu muat, interaksi, pergeseran layout, ukuran aset, dan render daftar.
- [ ] **UI-U12-02** — Tetapkan anggaran performa per jenis halaman berdasarkan baseline dan kebutuhan pengguna.
- [ ] **UI-U12-03** — Optimalkan pemuatan font, gambar, ikon, CSS, dan pemisahan kode sesuai hasil pengukuran.
- [ ] **UI-U12-04** — Definisikan pagination, pencarian server, dan virtualisasi bila volume data memerlukannya.
- [ ] **UI-U12-05** — Tetapkan cache/freshness, cancellation, debounce, serta penghindaran request ganda per alur.
- [ ] **UI-U12-06** — Ukur keberhasilan tugas, waktu tugas, kegagalan form, dan pemulihan tanpa merekam isi sensitif.
- [ ] **UI-U12-07** — Sediakan pemantauan error frontend dan request reference dengan redaction yang sesuai.
- [ ] **UI-U12-08** — Pelihara build/typecheck kedua konsumen dan pemeriksaan regresi pada perilaku berisiko.
- [ ] **UI-U12-09** — Catat regresi, penyebab, perbaikan, dan hasil pengukuran ulang pada bukti perubahan.

### U13 — Pengelolaan design system dan rilis UI

**Pemilik yang dibutuhkan:** maintainer UI, reviewer aplikasi, release owner. **Gate:** perubahan UI dapat dikirim, ditinjau, diadopsi, dan dipulihkan secara terkendali.

- [x] **UI-U13-01** — Tetapkan kriteria penerimaan komponen baru dan kapan komponen tetap lokal di aplikasi.
- [x] **UI-U13-02** — Dokumentasikan kontrak versi internal, deprecation, breaking change, dan panduan migrasi.
- [x] **UI-U13-03** — Definisikan preview yang aman untuk review desain dan isi; pisahkan fixture dengan data produksi.
- [x] **UI-U13-04** — Sediakan contoh penggunaan dan daftar konsumen untuk komponen yang berubah.
- [ ] **UI-U13-05** — Tetapkan review visual untuk layar dan state penting beserta bukti desktop/mobile.
- [ ] **UI-U13-06** — Buat gate rilis UI yang terhubung dengan release gate produk dan readiness backend.
- [ ] **UI-U13-07** — Rancang rollout/rollback perubahan visual dan perilaku yang memengaruhi tugas penting.
- [ ] **UI-U13-08** — Tinjau komponen duplikat, variasi yang tidak terpakai, dan utang CSS secara berkala.
- [ ] **UI-U13-09** — Arsipkan pola lama beserta migrasinya; perbarui katalog dan checklist setelah adopsi selesai.

### U14 — Ekspansi jangka panjang berbasis kebutuhan

**Pemilik yang dibutuhkan:** product/domain terkait, design system, platform. **Gate:** setiap perluasan mempunyai pengguna, data, bukti manfaat, dan owner yang jelas.

- [ ] **UI-U14-01** — Rancang kontribusi menu/slot modul yang terkontrol setelah beberapa modul operasional memerlukannya.
- [ ] **UI-U14-02** — Evaluasi workspace tersimpan, filter tersimpan, dan personalisasi tata letak berdasarkan pola kerja pilot.
- [ ] **UI-U14-03** — Rancang koordinasi multipengguna, konflik edit, dan aktivitas bersama jika kolaborasi nyata membutuhkannya.
- [ ] **UI-U14-04** — Tambahkan visualisasi graph/timeline lanjut dengan tampilan tabel/daftar alternatif yang dapat diakses.
- [ ] **UI-U14-05** — Rancang antarmuka asistensi AI: konteks, sumber, usulan, biaya/latensi bila tersedia, serta persetujuan tindakan.
- [ ] **UI-U14-06** — Bangun dashboard HELIOGRID hanya ketika telemetry nyata, unit pengukuran, interval, dan freshness tersedia.
- [ ] **UI-U14-07** — Bangun antarmuka eksperimen material/quantum berdasarkan kontrak eksperimen, baseline, dan hasil yang dapat direproduksi.
- [ ] **UI-U14-08** — Evaluasi perintah cepat, shortcut, dan power-user flows setelah navigasi dasar terbukti mudah digunakan.
- [ ] **UI-U14-09** — Evaluasi laporan publik dan agregasi yang aman setelah kebijakan publikasi serta privasinya tersedia.
- [ ] **UI-U14-10** — Putuskan kebutuhan aplikasi native, offline, tema tambahan, atau package terpisah berdasarkan penelitian pengguna dan biaya pemeliharaan.

### Bukti penyelesaian fondasi package per 22 Oktober 2026

| ID | Bukti |
| --- | --- |
| UI-U03-01 | API publik di packages/ui/src/index.ts; Button, Panel, Badge, dan Notice dikonsumsi aplikasi. |
| UI-U03-02 | Kontrak komponen di README package dan tipe props; package lolos pnpm --filter @empire/ui typecheck. |
| UI-U03-03 | Katalog lokal di packages/ui/catalog; pnpm --filter @empire/ui catalog:build menghasilkan build berhasil. |
| UI-U03-10 | README menjelaskan React 19, CSS, Next transpilation, konsumsi Vite, serta batas server/client: Tabs/Switch memerlukan owner Client Component untuk callback; fungsi callback ConfirmDialog/tombol/form tidak dapat melintasi batas Server-to-Client. |
| Integrasi | Typecheck dan build command center serta portal berhasil setelah penggunaan package. |
| UI-U02-03/04/06/07 | `packages/ui/src/tokens.css` mendefinisikan token berlapis untuk warna, status, tipografi, spasi, ukuran, elevation, fokus, ikon, dan motion. Primitive CSS mengonsumsi alias semantik; Button dan Switch memakai durasi/easing token, disabled opacity satu sumber, dan reduced motion menonaktifkan animasi loading serta pergeseran hover Button. Portal meniadakan pergeseran hover frontier; Command Center meniadakan putaran orbit dan pergeseran hover kartu. |
| UI-U02-02 (metadata katalog) | Demo tema katalog memperbarui `<meta name="theme-color">` dari `--eol-color-background`; browser review membuktikan nilai berubah dari `#080b12` ke `#f2f6f5` pada tema terang dan kembali pada tema gelap. |
| UI-U02-05 | Fontsource menyediakan font lokal terpin `Space Grotesk Variable` dan `DM Mono` lewat stylesheet UI; WOFF2 terpilih total sekitar 78 KB sebelum kompresi. Fallback sistem, subset karakter, `font-display: swap`, dan lisensi SIL OFL 1.1 terdokumentasi di README serta `packages/ui/licenses/`; Google Fonts runtime import portal dihapus. |
| UI-U02-08 (berjalan) | Command center memakai token bersama untuk canvas/foreground root, layout shell, tipografi, fokus, status, kartu metrik, metadata canvas, dan form controls. Portal memakai token bersama untuk teks, action/focus, indikator sukses, border struktur, surface statistik/identitas/section/frontier/flow/atlas, latar dan indikator aktif tab Explorer, navigasi portal, serta kontrol bahasa. Semua link aksi portal memakai varian `buttonClassName` bersama; CSS lokal hanya mengatur ukuran/tata letak tanpa override warna atau hover primitive. Nilai semantik tema light memakai alias token untuk text, surface, border, accent, dan gold; visual desktop terang ditinjau sesudah migrasi dan satelit tetap terlihat utuh. Glow, artwork, serta overlay transparan tetap lokal dan review seluruh route masih diperlukan. |
| UI-U03-03 | Katalog lokal memuat primitive dasar, state loading/empty/error, skeleton, swatch semantik dan nama token, serta pratinjau tema gelap/terang pada komponen yang sama; audit responsif, kontras visual, serta interaksi keyboard tetap tersisa. |
| UI-U03-06 | State resource dan Skeleton ada di API publik serta katalog. Command center membedakan katalog kosong yang berhasil dimuat dari kegagalan API, memberi tindakan coba lagi, dan memakai loading label/skeleton saat fetch awal. |
| UI-U03-06 (kontrak diperjelas) | `Notice` danger mengumumkan `alert` secara default; `LoadingState` busy dapat diturunkan setelah selesai; `EmptyState`/`ErrorState` menyediakan pilihan role status/region dan alert/region untuk mencegah pengumuman ganda. Bila memakai `region`, judul state menjadi accessible name melalui `aria-labelledby` unik, kecuali consumer memberikan ID heading pengganti. Katalog memperlihatkan variasi role serta busy; DOM hasil render memastikan setiap state region terhubung ke heading yang benar. |
| UI-U03-07 | Primitive `Tabs` mengelola satu tab stop, arrow key sesuai orientasi, Home/End, disabled tab, selection terkontrol, pasangan ID `aria-controls`/`aria-labelledby` yang selalu menunjuk panel nyata, dan hanya mount isi panel aktif. Katalog keyboard membuktikan ArrowRight, Home, dan End; AX tree mengekspos role tab dan panel aktif. README mendokumentasikan remount panel serta state yang perlu diangkat oleh consumer. |
| UI-U03-08 | `ConfirmDialog` memakai native modal `<dialog>` dengan siklus Tab/Shift+Tab eksplisit. Browser review membuktikan fokus awal pada Cancel, Shift+Tab menuju Confirm example, Tab membungkus kembali ke Cancel, Escape menutup modal, dan fokus kembali ke pemicu. Simulasi busy/error membuktikan dialog tetap terbuka; pending menonaktifkan kedua aksi, menampilkan label Processing…, dan memasang `aria-busy="true"`; error lokal muncul sebagai alert tanpa mengirim data. Label judul/deskripsi terhubung; `busyLabel` dan `cancelLabel` dapat dilokalkan. Perilaku pembaca layar tetap perlu bukti tambahan. |
| UI-U03-06 (status feedback) | `Notice` kini memiliki tone `success`; Command Center merender hasil aksi terkonfirmasi sebagai status sukses terpisah dari error `danger`. Katalog menampilkan info, success, warning, dan danger. Catatan invokasi lokal serta status editorial memakai `Notice role="note"`, dengan layout aplikasi tanpa override surface/tone primitive. |
| UI-U02-08 (Command Center override) | Selector tombol generik telah dibatasi ke navigasi lokal; action button dari `@empire/ui` mempertahankan token/variannya. `.notice` aplikasi hanya mengatur jarak sehingga warna status tetap dikendalikan primitive. Pencarian global kini memakai `TextField`, mempertahankan focus ring yang terlihat pada wrapper, dan mewarnai state dengan token semantik termasuk fallback forced-colors. Link, hover link, serta focus-visible native global kini memakai token accent/focus package. Canvas dan foreground root Command Center juga menggunakan token semantik; palette semantic light kini berada di tokens.css dan dipakai Portal melalui data-theme, sementara Command Center tetap dark; indikator health, teks metrik, dan status pill Hero memetakan readiness aktual (checking/ok/degraded/unavailable) ke token status, sehingga label tidak lagi selalu mengklaim LIVE; titik cluster mengikuti readiness, dan hover/selected navigation memakai token interaksi; shell, operator card, connection card, topbar, breadcrumb, headings, metadata, metric panels, workspace actions, serta event list/detail kini memakai token surface/border/text/accent. Catatan invokasi dan editorial memakai `Notice` dari package, dengan CSS lokal hanya mengatur layout. Directory/knowledge table, agent/RFC/research/evidence cards, forms, dan login memakai token surface/border/text; kontrol form dan Button tidak lagi dioverride radius-nya oleh aplikasi. Sisa literal terutama radial brand glow serta ornamen sistem yang tetap lokal. Audit override lain di portal dan route berbeda tetap berjalan. |
| UI-U05-04 (partial) | View switcher Command Center memakai primitive `Button` dalam `role="group"`, menandai pilihan aktif dengan `aria-pressed`, mempertahankan visibilitas permission-aware, serta menghubungkan tombol ke region konten berlabel judul melalui `aria-controls`. Error login menggunakan Notice danger. Model route/context operasional lebih luas belum selesai. |
| UI-U04-04 (Explorer styling hook) | Tab Explorer memberi class melalui prop `tabClassName`; stylesheet portal menargetkan class hook itu alih-alih selector DOM `.explorer-menu button`. Perilaku keyboard dan layout mobile yang telah ada tetap dipertahankan; review visual viewport sempit masih belum ditutup. |
| UI-U04-03 (parsial) | Portal menyediakan skip link keyboard-visible menuju landmark main yang dapat difokuskan. Primary navigation menampilkan empat tautan pada layar sempit dan mengekspos `aria-current="page"` untuk route lokal aktif. Pada 375 px menu dapat dibuka lalu tertutup sesudah memilih Peta Jalan; route aktif berubah ke Peta Jalan, dan dokumen tidak melebar secara horizontal. Fokus anchor lintas rute serta review breakpoint lain masih perlu bukti. |
| UI-U03-04 | Form login, RFC, riset, dan bukti di command center memakai `FieldLabel`, `TextField`, `TextArea`, dan `SelectField` native dari package; pencarian global juga memakai `TextField` dengan gaya shell dan focus ring semantik. Katalog memperlihatkan relasi `aria-describedby`, invalid input/select, dan disabled input; CSS kontrol, fokus, disabled, dan invalid memakai token semantik. Review browser lokal memperlihatkan ring fokus pada TextField login saat difokuskan; pencarian global belum dapat ditinjau live karena API gagal diakses dan layar berhenti pada autentikasi. |
| UI-U03-05 (parsial) | `Switch` controlled di API publik memakai button native dengan `role="switch"`, `aria-checked`, keyboard activation native, dan callback `onCheckedChange`; Portal menggunakannya untuk preferensi tema tersimpan, katalog menggunakannya untuk preview palette. `SelectField` native telah dipakai di formulir Command Center. Checkbox/radio belum dibangun karena belum ada alur formulir yang memerlukannya. |
| UI-U03-11 | Pada viewport 308 px (setengah lebar default 617 px), katalog tidak memiliki overflow horizontal di dokumen maupun elemen turunannya; grid token, tab label panjang, Notice identifier, tombol preview, beberapa state kosong, dan tumpukan pesan membungkus dalam tema gelap resmi. Uji viewport 375 px juga dilakukan. Forced colors, zoom browser aktual, dan pembaca layar diverifikasi terpisah di UI-U11/UI-U03-12. |
| UI-U03-12 (bukti interaksi parsial) | Katalog menampilkan Notice statis tanpa live announcement saat muat; aksi “Add urgent update” menghasilkan pesan baru di `role="alert"`, sementara indikator pemuatan memakai `role="status"`. Keyboard Tabs dan ConfirmDialog dicatat pada UI-U03-07/08 dan UI-U11-02. Pemeriksaan pembaca layar dan pemeriksaan interaksi otomatis lintas kontrol masih belum dilakukan. |
| UI-U11-02 (audit parsial) | Browser keyboard review Portal membuktikan Tab menampilkan skip link, Enter memindahkan lokasi/fokus ke `#main-content`, navigasi mobile dapat dibuka dengan tombol lalu menutup sesudah memilih route, dan `aria-current="page"` mengikuti route. Katalog: tab memakai satu tab stop, ArrowRight memilih tab berikutnya dan Home kembali ke tab pertama; dialog menaruh fokus awal pada Cancel, Shift+Tab menuju aksi terakhir, Tab membungkus ke aksi pertama, Escape menutupnya dan fokus kembali ke Preview confirmation, serta action pending menonaktifkan kedua tombol sampai error alert lokal dirender. Pada layar masuk Command Center, Tab mencapai input Username dan focus ring tampak. Audit seluruh urutan fokus, pembaca layar, serta modal lain di app shells masih terbuka. |
| UI-U11-04 (implementasi parsial) | `packages/ui/src/styles.css` menyediakan fallback `forced-colors: active` untuk surface, kontrol, tab terpilih, fokus, notice, badge, dialog, serta skeleton. Pada Portal dan katalog, viewport 375 px tidak menghasilkan overflow horizontal; route Beranda, Sistem, dan Peta Jalan membungkus konten. Layar masuk Command Center juga tidak overflow pada 375 px. Di layar sempit, section hero membatasi overflow horizontal halaman sementara `.hero-visual` tetap membiarkan label satelit terlihat. Audit 320 px/zoom browser aktual, forced colors di browser/OS high contrast, serta route operasional Command Center masih terbuka; API lokal tidak merespons sehingga review Command Center berhenti di layar masuk. |
| UI-U04-04 (berjalan) | Explorer portal kini memakai primitive `Tabs`; keyboard panah bawah memilih sistem berikutnya pada orientasi tegak, selected state dan detail panel berubah, serta status maturity tampil sebagai badge. Pemeriksaan viewport mobile dan konten seluruh sistem masih berlanjut. |
| UI-U07-06 (parsial) | Aksi CAB dan keputusan approval riset kini meminta konfirmasi berisi identitas record serta konsekuensi; RFC juga menampilkan rencana rollback. Perluasan konfirmasi ke konteks pemulihan dan audit alur end-to-end masih berjalan. |
| UI-U13-04 | README package mencatat kontrak dan contoh komponen, konsumen portal/100CENTER/katalog, serta alasan penempatan pola di package atau aplikasi. |
| UI-U13-01/02 | README menetapkan kriteria promosi komponen, batas pola lokal, kontrak package workspace-private, penanganan breaking change, migrasi lintas konsumen, dan masa deprecation bila migrasi bertahap memang diperlukan. |
| UI-U13-03 | Katalog hanya menggunakan fixture statis/fiktif dan interaksi lokal; tidak ada request API atau data tenant/produksi. |
| UI-U02-10 (parsial) | Kalkulasi statis WCAG relative luminance atas alias token: text/background 16.91:1, muted/background 7.79:1, text/surface 15.56:1, muted/surface 7.17:1, accent/background 14.42:1, dan foreground tiap status terhadap surface masing-masing ≥8.91:1. Dalam light palette: text/background 14.64:1, muted/background 5.48:1, text/surface 15.95:1, muted/surface 5.97:1, accent/background 4.61:1, setiap status foreground/surface ≥6.11:1, dan border kuat/surface 3.55:1. Pasangan foreground token ini melewati 4.5:1 untuk teks normal. README paket mencatat metodologi dan batasnya. Kalkulasi tidak membuktikan kontras overlay transparan, artwork, kombinasi route, fokus tiap aplikasi, atau hasil rendering browser. Inspeksi browser desktop light dilakukan pada Beranda, Atlas Sistem, dan Peta Jalan Portal; layar masuk Command Center ditinjau dalam tema gelap, tetapi API tidak tersedia sehingga review berhenti pada layar autentikasi. Perbandingan kontras seluruh aplikasi, zoom, layar sempit kedua aplikasi, serta forced colors masih terbuka. |

## 12. Urutan kerja terdekat yang direkomendasikan

| Urutan | Paket kerja | ID utama | Hasil yang harus dapat ditinjau |
| --- | --- | --- | --- |
| 1 | Audit UI dan tugas pengguna | UI-U00-05, UI-U01-01–03 | Matriks layar/komponen, masalah, dan alur prioritas |
| 2 | Kontrak visual dan komponen awal | UI-U02-02–07, UI-U03-02 | Token map, tipografi, state, serta keputusan variasi |
| 3 | Katalog dan contoh nyata | UI-U03-03, UI-U03-10 | Semua primitive awal terlihat beserta props dan state |
| 4 | Matangkan portal prioritas | UI-U04-01–04, UI-U03-07 | Alur publik yang rapi di desktop, mobile, dan keyboard |
| 5 | Siapkan shell serta kontrak operasional | UI-U05-01–05, UI-U06-01 | Navigasi, konteks, status, dan rancangan alur pertama |
| 6 | Implementasikan satu alur nyata | UI-U06-02–10 | ResearchRun/Job/Evidence lengkap sesuai readiness API |

Paket kerja ini tidak mewajibkan seluruh library form, tabel, grafik, atau dialog selesai sekaligus. Komponen dibuat bersama layar pertama yang menggunakannya, lalu dievaluasi untuk pemakaian berikutnya.

## 13. Definisi selesai dan bukti

Satu pekerjaan UI selesai ketika tujuan pengguna, batas scope, perilaku, dan integrasinya dapat diperiksa. Checklist berikut dipakai sebagai template penerimaan dan disesuaikan dengan dampak perubahan.

- [ ] Tujuan, pengguna, route/komponen, dan kontrak data yang terdampak telah dicatat.
- [ ] State dan pesan yang relevan telah diimplementasikan, termasuk kegagalan serta pemulihannya.
- [ ] Izin, konteks tenant, waktu data, dan asal informasi sesuai kontrak fitur.
- [ ] Perilaku keyboard, focus, label, responsif, dan reduced motion yang relevan telah diperiksa.
- [ ] Konsumen yang terdampak lolos pemeriksaan tipe dan build; pemeriksaan interaksi disesuaikan dengan risiko.
- [ ] Bukti visual atau rekaman tugas, temuan review, serta batas yang belum terselesaikan dilampirkan.
- [ ] Dokumentasi komponen, keputusan, status integrasi, dan ID checklist diperbarui.
- [ ] Perubahan dapat dipulihkan atau dimigrasikan bila memengaruhi perilaku yang sudah digunakan.

Template bukti per item:

```text
ID checklist:
Pemilik aktual:
Scope dan dependensi:
Issue/perubahan kode:
Hasil dan perilaku yang tersedia:
Bukti visual/interaksi/build:
Status integrasi: fixture / API lokal / staging / produksi
Temuan atau batas tersisa:
Reviewer dan tanggal review:
Keputusan: selesai / perlu revisi / tertunda / dibatalkan
```

## 14. Ketergantungan, risiko perencanaan, dan keputusan terbuka

| Hal yang belum pasti | Dampak pada UI | Tindakan perencanaan |
| --- | --- | --- |
| Pengguna pilot dan tugas pertama | Navigasi dapat berkembang mengikuti asumsi internal | Konfirmasi tugas sebelum memperluas screen inventory |
| Owner API/Gen2 dan kontrak | Kontrol UI dapat mendahului kemampuan backend | Kaitkan integrasi dengan ADR dan kontrak yang disetujui |
| IdP, tenant, role, dan mandat | Shell dan alur keputusan belum dapat difinalkan | Rancang state dan integrasikan setelah kontrak identity jelas |
| Lisensi serta kesiapan sumber | Knowledge UI belum dapat mempublikasikan seluruh isi | Gunakan metadata atau fixture berlabel sesuai hak yang tersedia |
| CSS lokal yang menimpa primitive | Package bersama terlihat konsisten hanya pada contoh | Audit specificity dan migrasikan setiap konsumen secara bertahap |
| Status yang mempunyai arti berbeda | Badge dapat memberi kesan sistem lebih siap | Definisikan taxonomy dan pemetaan label per domain |
| Ledakan komponen dan variasi | Biaya pemeliharaan meningkat sebelum kebutuhan terbukti | Syaratkan contoh pemakaian dan owner untuk penambahan API |
| Telemetry atau angka yang belum ada | Dashboard dapat menampilkan informasi semu | Tampilkan unavailable dan kebutuhan data secara jelas |
| Cakupan bahasa/perangkat | Desain dapat gagal saat konten atau konteks berkembang | Uji teks, perangkat, dan jaringan pada alur pertama |

Keputusan yang perlu dicatat pada tahap awal: bahasa utama produk, strategi font, scope tema, kebutuhan katalog komponen, target aksesibilitas, browser/perangkat yang didukung, taxonomy status, serta alur operasional pertama. Setiap keputusan menyertakan alasan dan kondisi kapan perlu ditinjau ulang.

## 15. Pemeliharaan blueprint

Perbarui dokumen ketika sebuah gate tercapai, keputusan desain berubah, domain baru mulai diimplementasikan, atau temuan pengguna mengubah prioritas. Jangan mengubah status hanya karena screenshot terlihat selesai. Rancangan, komponen, integrasi data, penggunaan pilot, dan kesiapan rilis mempunyai bukti masing-masing.

Saat menambah domain, mulai dari tugas pengguna dan kontrak datanya. Tentukan pola yang sudah dapat dipakai, kesenjangan komponen, dampak aksesibilitas, dan kebutuhan review. Tambahkan ID baru tanpa mengganti arti ID yang sudah pernah digunakan.

## 16. Referensi dan hubungan dengan blueprint lain

- [Master Blueprint](MASTER_BLUEPRINT.md): istilah, domain, dan lifecycle Journey/Path.
- [Genesis v4 Monorepo](BLUEPRINT_V4_MONOREPO.md): stack, boundary, dan tahap engineering.
- [Architecture](ARCHITECTURE.md): kepemilikan kemampuan dan kontrak integrasi.
- [Module System](MODULE_SYSTEM_SPEC.md): dependency, lifecycle, dan kontribusi UI modul.
- [Governance](GOVERNANCE.md): actor, mandate, consent, review, dan hak akses.
- [Delivery Roadmap](DELIVERY_ROADMAP.md): urutan kemampuan produk.
- [Release Gates](OPERATIONS_RELEASE_GATES.md): bukti kesiapan produk dan deployment.
- [Developer Quickstart](DEVELOPER_QUICKSTART.md): menjalankan monorepo lokal.
- [Package UI](../packages/ui/README.md): ekspor dan cara konsumsi package saat ini.

Blueprint UI ini mengatur pengalaman dan presentasi. Perubahan kepemilikan API, otorisasi, penyimpanan, serta release tetap mengikuti blueprint engineering dan proses keputusan yang berlaku.
