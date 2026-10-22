# Grand plan penyempurnaan Empire of the Light

Tanggal: 23 Oktober 2026. Cakupan: fondasi platform, tenant/work, CRM dan operasi keuangan, dokumen, kolaborasi, DNA/UNILEX, World Monitor, YouTube Sentinel, dan Command Center.

Tujuan: membangun platform yang datanya dapat dipercaya, aksesnya jelas, tindakannya dapat diaudit, serta alur operasionalnya lengkap. Dokumen ini menggabungkan review repo dan brainstorm menjadi backlog pelaksanaan; penyusunan rencana ini belum memperbaiki implementasi.

**Status sekarang:** [x] S0.1–S0.3 baseline dan gate lokal; [x] S1.1 rate limit YouTube; [x] S2.1 alert World Monitor; [x] S3.1 fondasi Docker/Next.js. Pekerjaan belum dipromosikan: 433 path lokal bercampur, Docker runtime belum tersedia, dan push `dev` menerbitkan release. Rincian bukti serta blocker ada pada bagian 18.

## Cara memakai checklist

- Kotak mencerminkan bukti yang tersedia pada snapshot terakhir. Kotak kosong berarti pekerjaan atau bukti penerimaannya masih perlu diselesaikan.
- `[FIX]`: ada indikasi masalah konkret dari pembacaan kode. Konfirmasi skenario sebelum mengubah implementasi.
- `[AUDIT]`: periksa perilaku atau kumpulkan bukti; hasilnya dapat berupa "sudah benar".
- `[BUILD]`: pengembangan atau penyempurnaan yang diusulkan.
- `[DECIDE]`: keputusan desain yang harus ditulis sebelum implementasi terkait.
- `[SPIKE]`: eksperimen opsional dengan hipotesis, batas biaya, ukuran hasil, dan cara menghentikannya.
- Satu ID adalah satu unit kerja kecil. Pecah lagi bila tidak dapat ditinjau dalam satu perubahan yang jelas.
- Centang hanya dengan bukti: perubahan kode/dokumen, hasil pemeriksaan, atau keputusan tertulis. Jangan menyamakan validator lulus dengan kesiapan produksi.
- Setiap unit kerja mencatat penanggung jawab, dependensi, bukti, dan keterbatasan. Penanggung jawab belum ditetapkan oleh dokumen ini.

## Urutan pelaksanaan

| Gelombang | Paket | Hasil yang dituju | Syarat lanjut |
| --- | --- | --- | --- |
| A: tutup celah | 00–02 + keputusan 03.01–03.02 | Baseline jelas, endpoint terlindungi, data palsu terisolasi | Gate 00–02 dan keputusan scope terbukti |
| B: integritas | 03–06 | Batas tenant, audit, transaksi, dan data monitoring konsisten | Gate 03–06 terbukti |
| C: alur lengkap | 07–12 | Scheduler, review, work, keuangan, migrasi, dan UI dapat digunakan | Gate tiap alur terkait terbukti |
| D: operasional | 13–14 | Pemulihan, pengukuran, dan promosi rilis dapat dipertanggungjawabkan | Gate rilis terbukti |
| E: eksperimen | 15 | Maksimal dua prototipe terpilih pada satu waktu | Fondasi yang digunakan sudah lolos gate |

Dependensi utama: 00 → keputusan scope 03.01–03.02 → 01 + 02 → sisa 03 + 04 → 05–12 sesuai alur → 13 → 14. Penutupan akses anonim melalui 01.03–01.05 dapat segera dilakukan sambil menunggu keputusan scope. Kontrak akses detail, proyeksi publik, dan pemetaan izin mengikuti keputusan scope tersebut.

Sebelum menerapkan perubahan schema/data pada paket mana pun, selesaikan preflight terkait 05.01–05.04 dan bukti restore 13.09. Pekerjaan ini dimajukan sesuai kebutuhan migrasi; tidak perlu menunggu seluruh paket 05/13 selesai. Rancangan dan dokumentasi dapat berjalan bersama. Eksperimen tidak menjadi syarat rilis fondasi.

## Dasar temuan dan batas kepastian

Temuan berasal dari review statis working tree `dev`, termasuk perubahan lokal yang sudah ada. Belum ada pembuktian lewat eksploitasi, pengujian runtime, atau pengukuran beban dalam review ini. Nomor baris dapat berubah.

| ID temuan | Indikasi pada kode | Paket penyelesaian |
| --- | --- | --- |
| F01 | Handler `youtube/scan`, `youtube/action`, dan POST `youtube/schedule` tidak memasang guard sesi; ketiganya masuk daftar rute publik | 01 |
| F02 | Daftar YouTube publik mengirim objek temuan termasuk `operatorNotes`; sanitasi berfokus pada data partner | 01, 03, 08 |
| F03 | Crawler yang tidak memperoleh hasil membuat item sintetis; alur scan mencoba menyimpan hasil tersebut | 02 |
| F04 | Detail partner memakai query koleksi tanpa `.first()` sehingga array kosong dapat dikirim sebagai 200 | 03 |
| F05 | Sejumlah mutasi work/enterprise menulis audit setelah transaksi perubahan selesai | 04, 10 |
| F06 | `dna:generate` menghapus direktori paket lama; kompatibilitas import perlu diputuskan sebagai migrasi | 11 |
| F07 | Input sweep tidak memiliki batas jumlah/panjang query dan hasil per query yang jelas pada jalur API tersebut | 07 |
| F08 | `globalAlertLevel` World Monitor ditentukan dari kesehatan database, walaupun daftar alert dapat memuat alert kritis | 06 |
| F09 | Dokumentasi tenancy menyebut dokumen "metadata saja" sekaligus mendeskripsikan adapter upload/download | 09, 14 |

Titik awal kode: [route monitoring](../apps/api/src/routes/world-monitor.ts), [registrasi rute](../apps/api/src/server.ts), [crawler](../packages/batteries-world-monitor/src/youtube-sentinel.ts), [storage Sentinel](../apps/api/src/youtube-sentinel-storage.ts), [scheduler Sentinel](../apps/api/src/youtube-sentinel-scheduler.ts), [ingest World Monitor](../apps/api/src/world-monitor-ingest.ts), [partner](../apps/api/src/routes/partners.ts), [enterprise](../apps/api/src/routes/enterprise.ts), [generator DNA](../scripts/generate-batteries-dna.mjs).

## 00. Baseline dan kendali pekerjaan

- [x] 00.01 [AUDIT] Catat commit acuan, branch aktif, dan daftar perubahan lokal sebelum pelaksanaan.
- [x] 00.02 [AUDIT] Pisahkan daftar pekerjaan yang sudah berlangsung dari temuan review ini.
- [x] 00.03 [AUDIT] Konfirmasi ulang F01–F09 terhadap kode saat akan dikerjakan.
- [ ] 00.04 [BUILD] Buat daftar endpoint beserta metode, tujuan, tipe data, dan pemilik modulnya.
- [ ] 00.05 [BUILD] Buat daftar fitur berstatus tersedia, perlu bukti, sedang dibangun, dan usulan.
- [ ] 00.06 [DECIDE] Tetapkan penanggung jawab dan reviewer tiap paket.
- [ ] 00.07 [BUILD] Catat dependensi data dan risiko rollback untuk tiap perubahan schema.
- [x] 00.08 [AUDIT] Pastikan versi Node mengikuti `.node-version` dan pnpm mengikuti `packageManager`.
- [x] 00.09 [AUDIT] Pastikan source, schema, manifest modul, dan lockfile sesuai satu sama lain.
- [x] 00.10 [AUDIT] Pastikan `.env`, kredensial, database lokal, dan hasil build tidak masuk perubahan rilis.
- [ ] 00.G [AUDIT] Gate: setiap temuan punya skenario, lokasi, dampak, dan unit kerja yang dapat ditinjau.

## 01. Akses API dan privasi — dikerjakan paling awal

Prasyarat pemetaan akses dan field: keputusan 03.01–03.02. Guard untuk menutup akses anonim dapat dipasang segera.

- [ ] 01.01 [DECIDE] Klasifikasikan setiap metode endpoint menjadi publik, operator global, atau tenant.
- [ ] 01.02 [BUILD] Tulis daftar field respons publik yang diizinkan; field baru tidak otomatis terbuka.
- [x] 01.03 [FIX] Tambahkan guard sesi pada POST scan YouTube.
- [x] 01.04 [FIX] Tambahkan guard sesi pada POST action YouTube.
- [x] 01.05 [FIX] Tambahkan guard sesi pada POST pengaturan/pemicu scheduler YouTube.
- [x] 01.06 [DECIDE] Tetapkan izin terpisah untuk membaca temuan, memicu scan, meninjau, dan mengatur scheduler.
- [x] 01.07 [BUILD] Daftarkan izin tersebut pada manifest/seed dan petakan hanya ke role yang berhak.
- [x] 01.08 [FIX] Lindungi pembacaan detail Sentinel atau buat endpoint publik dengan proyeksi terbatas.
- [x] 01.09 [FIX] Keluarkan catatan operator dan metadata internal dari setiap respons publik.
- [ ] 01.10 [AUDIT] Periksa respons scan, action, fallback, error, dan ekspor terhadap kebocoran field.
- [x] 01.11 [FIX] Selaraskan daftar rute publik dan OpenAPI berdasarkan metode + path.
- [x] 01.12 [AUDIT] Pastikan deklarasi `security` OpenAPI tidak digunakan sebagai pengganti guard runtime.
- [x] 01.13 [BUILD] Terapkan rate limit dan batas konkurensi untuk aksi scan yang berbiaya tinggi.
- [x] 01.14 [AUDIT] Buktikan request tanpa sesi ditolak dan sesi tanpa izin mendapat penolakan yang tepat.
- [ ] 01.15 [AUDIT] Buktikan sesi kedaluwarsa/dicabut tidak dapat mengubah status atau scheduler.
- [ ] 01.G [AUDIT] Gate: tidak ada mutasi Sentinel anonim; kontrak publik lulus pemeriksaan field sensitif.

Bukti parsial paket 01: `pnpm --filter @empire/api test` (17/17 lulus), `pnpm --filter @empire/api typecheck`, dan `pnpm --filter @empire/api build` lulus. `apps/api/tests/sentinel-auth-guards.test.mjs` memverifikasi request anonim (401), token invalid (401), sesi aktif tanpa izin (403), dan izin yang cocok (lolos). `apps/api/tests/youtube-scan-gate.test.mjs` menguji kuota rolling, identitas, pembersihan key kedaluwarsa, konkurensi operator/global, dan wiring route 429/503 setelah otorisasi. Rate limit: 5 scan/operator/10 menit; maksimal 3 scan global bersamaan dan 1/operator. Limiter masih process-local, sehingga shared store wajib sebelum API multi-replica. Audit semua bentuk respons, sesi dicabut/kedaluwarsa, dan gate 01.G masih terbuka.

## 02. Keaslian data, provenance, dan hasil sintetis

- [x] 02.01 [FIX] Ganti kegagalan crawler dengan hasil kosong/failed yang menjelaskan penyebabnya.
- [x] 02.02 [BUILD] Pindahkan contoh sintetis ke mode demo/latihan yang eksplisit.
- [ ] 02.03 [BUILD] Tambahkan penanda asal data yang dipertahankan dari crawler sampai UI dan ekspor.
- [ ] 02.04 [BUILD] Pisahkan keadaan live, partial, failed, stale, dan synthetic.
- [ ] 02.05 [AUDIT] Inventaris record lama dengan `fallback_synthetic` atau pola ID sintetis.
- [ ] 02.06 [BUILD] Susun dry-run karantina record sintetis lama beserta jumlah dan alasan deteksinya.
- [ ] 02.07 [BUILD] Siapkan backup dan rollback sebelum menerapkan karantina; jangan hapus otomatis.
- [ ] 02.08 [FIX] Keluarkan record sintetis dari total temuan nyata, alert, antrean review, dan laporan operasional.
- [ ] 02.09 [BUILD] Simpan `scanRunId`, engine, waktu pengambilan, URL sumber, dan versi aturan per hasil.
- [ ] 02.10 [BUILD] Bedakan bukti dari judul/deskripsi dengan bukti dari transkrip.
- [ ] 02.11 [AUDIT] Buktikan kegagalan semua engine tidak menghasilkan video atau bukti rekaan.
- [ ] 02.12 [AUDIT] Buktikan ekspor dan tampilan tidak menghilangkan penanda demo/partial.
- [ ] 02.G [AUDIT] Gate: setiap temuan operasional punya asal yang bisa ditelusuri; data demo terisolasi.

Bukti paket 02 awal: `pnpm --filter @empire/batteries-world-monitor test` (9/9 lulus) membuktikan repository default kosong, crawler kosong memberi `no_results` tanpa menambah record, serta corpus demo hanya aktif dengan `YOUTUBE_SENTINEL_DEMO_MODE=true` dan semua item berlabel `demo_synthetic`. API dan Command Center typecheck lulus. Audit/karantina record sintetis historis dan pemisahan data demo dari hitungan operasional masih terbuka.

## 03. Tenant, role, partner, dan kepemilikan catatan

- [ ] 03.01 [DECIDE] Tetapkan apakah catatan dan keputusan review Sentinel milik operator global atau tenant.
- [ ] 03.02 [BUILD] Tulis matriks akses untuk identitas global, keanggotaan tenant, role tenant, dan izin global.
- [ ] 03.03 [AUDIT] Buktikan header tenant lain tidak membuka record milik tenant tersebut.
- [ ] 03.04 [AUDIT] Periksa perilaku tanpa membership, satu membership, dan beberapa membership.
- [ ] 03.05 [AUDIT] Buktikan membership suspended menutup akses pada seluruh endpoint tenant.
- [ ] 03.06 [AUDIT] Periksa konflik antara role tenant dan izin global; hindari pemberian izin implisit.
- [ ] 03.07 [FIX] Ambil satu record pada detail partner dan kembalikan 404 bila tidak ditemukan.
- [ ] 03.08 [AUDIT] Samakan respons detail partner yang hilang dan partner tenant lain.
- [ ] 03.09 [AUDIT] Periksa UUID, slug, pagination, status, dan referensi silang dengan schema input konsisten.
- [ ] 03.10 [AUDIT] Periksa invariant tenant pada workspace, project, task, document, partner, tag, dan research run.
- [ ] 03.11 [BUILD] Satukan pembuatan partner dan tautan Sentinel dalam transaksi.
- [ ] 03.12 [BUILD] Jadikan tautan tenant + video idempoten saat dua request bersamaan.
- [ ] 03.13 [BUILD] Tampilkan dan pilih partner yang sudah ada sebelum menawarkan partner baru.
- [ ] 03.14 [AUDIT] Periksa siklus parent partner, termasuk perubahan parent secara bersamaan.
- [ ] 03.G [AUDIT] Gate: skenario negatif lintas tenant terbukti dan kepemilikan catatan Sentinel tertulis.

## 04. Audit, transaksi, retry, dan outbox

- [ ] 04.01 [AUDIT] Inventaris mutasi yang memerlukan audit wajib.
- [ ] 04.02 [FIX] Satukan mutasi work dan audit wajib dalam transaksi yang sama.
- [ ] 04.03 [FIX] Satukan mutasi enterprise dan audit wajib dalam transaksi yang sama.
- [ ] 04.04 [BUILD] Catat perubahan status Sentinel, pemicu scan, dan pengaturan scheduler beserta pelakunya.
- [ ] 04.05 [BUILD] Tambahkan ID request/korelasi agar aksi API dapat ditelusuri sampai database dan worker.
- [ ] 04.06 [BUILD] Simpan field audit minimum: actor, scope, aksi, target, waktu, hasil, dan alasan bila diperlukan.
- [ ] 04.07 [AUDIT] Pastikan audit tidak menyalin token, signed URL, atau isi dokumen/catatan secara berlebihan.
- [ ] 04.08 [BUILD] Definisikan idempotency untuk aksi yang berisiko berulang setelah timeout.
- [ ] 04.09 [AUDIT] Periksa rollback seluruh batch outbox bila satu record gagal diproses.
- [ ] 04.10 [BUILD] Isolasi record outbox gagal agar satu record tidak menahan seluruh antrean.
- [ ] 04.11 [BUILD] Tambahkan batas percobaan, backoff, alasan kegagalan, dan antrean pemeriksaan manual.
- [ ] 04.12 [AUDIT] Buktikan retry tidak menggandakan notifikasi atau perubahan bisnis.
- [ ] 04.13 [AUDIT] Periksa keanggotaan penerima dan kebijakan akun nonaktif saat notifikasi diproses.
- [ ] 04.G [AUDIT] Gate: kegagalan audit membatalkan mutasi wajib; retry aman dan kegagalan worker dapat ditelusuri.

## 05. Schema, penyimpanan, dan konsistensi database

- [ ] 05.01 [AUDIT] Inventaris schema drift dan versi modul pada database yang sudah ada.
- [ ] 05.02 [BUILD] Tulis preflight, urutan migrasi, dan rollback untuk perubahan yang menyentuh data lama.
- [ ] 05.03 [AUDIT] Buktikan constraint unik yang diperlukan benar-benar terpasang pada database lama dan baru.
- [ ] 05.04 [AUDIT] Periksa constraint referensi tenant agar tidak bergantung sepenuhnya pada pemeriksaan API.
- [ ] 05.05 [AUDIT] Periksa index dari pola filter tenant, status, waktu, dan ID eksternal.
- [ ] 05.06 [BUILD] Ukur pertumbuhan tabel monitoring dan biaya query sebelum menambah data.
- [ ] 05.07 [DECIDE] Tetapkan retensi berbeda untuk raw response, observasi, scan run, audit, dan agregat.
- [ ] 05.08 [BUILD] Simpan raw response sekali per fetch/run bila sekarang berulang pada setiap observasi.
- [ ] 05.09 [BUILD] Definisikan ID/deduplikasi stabil untuk observasi eksternal dan video YouTube.
- [ ] 05.10 [AUDIT] Periksa konsistensi ID antara repo dalam memori, ID database, dan `videoId`.
- [ ] 05.11 [BUILD] Jadikan database sumber otoritatif bagi keputusan operator dan cache dapat dibangun ulang.
- [ ] 05.G [AUDIT] Gate: database lama dapat di-upgrade tanpa kehilangan record; restart tidak mengubah keputusan operator.

## 06. World Monitor: kebenaran status dan kualitas observasi

- [x] 06.01 [FIX] Pisahkan kesehatan API/database dari tingkat bahaya kejadian yang sedang dipantau.
- [x] 06.02 [FIX] Turunkan tingkat alert global dari alert valid dan freshness, dengan aturan agregasi tertulis.
- [x] 06.03 [AUDIT] Buktikan alert kritis tidak disertai indikator keseluruhan hijau yang menyesatkan.
- [ ] 06.04 [BUILD] Validasi parser per sumber: tipe angka, satuan, lokasi, waktu, dan rentang yang masuk akal.
- [ ] 06.05 [AUDIT] Buat fixture NOAA berbentuk objek dan array, termasuk respons fallback/header tabel.
- [ ] 06.06 [AUDIT] Buktikan waktu pengamatan hilang tidak otomatis menjadi observasi baru yang tampak fresh.
- [ ] 06.07 [AUDIT] Buktikan NaN, tanggal invalid, atau payload kosong tidak menjadi observasi available.
- [ ] 06.08 [BUILD] Tampilkan waktu pengamatan dan waktu pengambilan sebagai dua informasi berbeda.
- [ ] 06.09 [BUILD] Definisikan fallback per sumber dan alasan sumber fallback sedang aktif.
- [ ] 06.10 [BUILD] Gunakan satu mekanisme koordinasi ingest untuk scheduler dan refresh dari endpoint.
- [ ] 06.11 [BUILD] Batasi fetch bersamaan dan tambahkan timeout/retry per sumber.
- [ ] 06.12 [AUDIT] Pastikan satu sumber gagal tidak menggagalkan penyimpanan sumber lain.
- [ ] 06.13 [FIX] Sajikan history dari rentang query/agregat yang sesuai, bukan sekadar sampel observasi terbaru.
- [ ] 06.14 [BUILD] Deduplikasi event dan alert dari sumber utama/fallback untuk kejadian yang sama.
- [ ] 06.15 [BUILD] Tambahkan cooldown dan perubahan tingkat alert untuk mengurangi notifikasi berulang.
- [ ] 06.16 [DECIDE] Jelaskan arti confidence; bedakan tier sumber dengan akurasi yang telah dikalibrasi.
- [ ] 06.17 [AUDIT] Periksa izin penggunaan, atribusi, dan batas akses tiap penyedia data.
- [ ] 06.18 [BUILD] Pertahankan indikator unavailable bagi wilayah/sensor yang belum terhubung.
- [ ] 06.G [AUDIT] Gate: sumber mati, data basi, dan alert kritis ditampilkan dengan status yang konsisten serta history yang benar.

## 07. YouTube Sentinel: crawler dan scheduler

- [ ] 07.01 [FIX] Batasi jumlah query dalam satu sweep.
- [ ] 07.02 [FIX] Batasi panjang query dan tolak query kosong.
- [ ] 07.03 [FIX] Batasi `limitPerQuery` sebagai bilangan bulat dalam rentang yang disetujui.
- [ ] 07.04 [FIX] Batasi interval scheduler pada rentang aman termasuk batas timer runtime.
- [ ] 07.05 [BUILD] Tetapkan anggaran durasi, jumlah video, dan request jaringan per sweep.
- [ ] 07.06 [BUILD] Tambahkan `scanRunId` dan simpan run walaupun hasilnya nol atau gagal.
- [ ] 07.07 [BUILD] Bedakan pemicu operator, jadwal, retry, dan latihan.
- [ ] 07.08 [BUILD] Bedakan scanned, ditemukan baru, sudah ada, gagal persist, dan dilewati.
- [ ] 07.09 [AUDIT] Pastikan hasil satu scan dibedakan dari seluruh katalog dalam kontrak respons.
- [ ] 07.10 [BUILD] Terapkan lock/lease bersama bila aplikasi dijalankan lebih dari satu instance.
- [ ] 07.11 [BUILD] Sediakan penghentian run dan timeout yang menutup browser/koneksi aktif.
- [ ] 07.12 [BUILD] Simpan konfigurasi jadwal yang memang diharapkan bertahan setelah restart.
- [ ] 07.13 [FIX] Selaraskan `nextScheduledSweepAt` dengan timer yang benar-benar akan berjalan.
- [ ] 07.14 [AUDIT] Periksa status respons manual setelah `isSweepInProgress` dibersihkan.
- [ ] 07.15 [BUILD] Tambahkan retry/backoff terbatas untuk gangguan jaringan dan pembatasan penyedia.
- [ ] 07.16 [AUDIT] Buktikan manual scan dan scheduled scan tidak menggandakan pekerjaan yang sama.
- [ ] 07.17 [AUDIT] Periksa escaping query pada snippet skrip yang dihasilkan.
- [ ] 07.18 [BUILD] Tampilkan error persist sebagai hasil partial; jangan mengklaim data tersimpan hanya karena database sehat.
- [ ] 07.G [AUDIT] Gate: sweep berbatas, jadwal akurat, kegagalan tercatat, serta restart/retry tidak membuat run liar.

## 08. YouTube Sentinel: kualitas klasifikasi dan review manusia

- [ ] 08.01 [DECIDE] Definisikan apa yang dinilai: isi klaim pada bukti, konteks, dan batas kesimpulannya.
- [ ] 08.02 [BUILD] Tampilkan hasil heuristik awal sebagai indikasi yang perlu ditinjau.
- [ ] 08.03 [BUILD] Pisahkan skor otomatis, keputusan operator, dan tindakan lanjutan.
- [ ] 08.04 [BUILD] Catat versi aturan serta potongan bukti yang menyebabkan setiap kecocokan.
- [ ] 08.05 [BUILD] Tampilkan bukti yang mendukung dan konteks bantahan/edukasi yang melemahkan indikasi.
- [ ] 08.06 [AUDIT] Susun dataset berlabel manusia untuk promosi, bantahan, satire, berita, dan kutipan.
- [ ] 08.07 [AUDIT] Ukur false positive dan false negative per kategori; jangan memakai skor sebagai probabilitas tanpa kalibrasi.
- [ ] 08.08 [BUILD] Wajibkan alasan dan bukti sebelum status verifikasi dapat disimpan.
- [ ] 08.09 [BUILD] Definisikan transisi status yang diperbolehkan dan riwayat koreksinya.
- [ ] 08.10 [BUILD] Bedakan laporan disiapkan, dibuka di platform, dan dikonfirmasi terkirim.
- [ ] 08.11 [BUILD] Tambahkan mekanisme koreksi keputusan dan peninjauan ulang oleh reviewer lain.
- [ ] 08.12 [AUDIT] Periksa catatan kontak/afiliasi agar hanya memuat data yang diperlukan dan memiliki retensi jelas.
- [ ] 08.13 [BUILD] Tautkan dalil/rujukan ke sumber yang ditinjau dan pisahkan dari bukti pelanggaran kebijakan platform.
- [ ] 08.14 [BUILD] Pertahankan persetujuan operator untuk publikasi, pelaporan eksternal, dan amplifikasi.
- [ ] 08.G [AUDIT] Gate: keputusan dapat dijelaskan, dikoreksi, dan ditelusuri ke bukti; status selesai tidak diklaim tanpa konfirmasi.

## 09. Workspace, task, dokumen, dan kolaborasi

- [ ] 09.01 [AUDIT] Buktikan alur workspace → project → task berjalan dalam satu tenant.
- [ ] 09.02 [AUDIT] Periksa perilaku project/workspace yang diarsipkan terhadap pembuatan task dan dokumen baru.
- [ ] 09.03 [AUDIT] Periksa task selesai, dibuka ulang, dan timestamp `completedAt`.
- [ ] 09.04 [AUDIT] Periksa assignment kepada anggota suspended/nonaktif.
- [ ] 09.05 [DECIDE] Tetapkan hak baca metadata dan isi dokumen untuk tiap klasifikasi.
- [ ] 09.06 [AUDIT] Periksa siapa yang dianggap administrator untuk dokumen restricted dalam model role saat ini.
- [ ] 09.07 [BUILD] Cegah dua upload bersamaan saling menimpa pointer file pada record yang sama.
- [ ] 09.08 [BUILD] Tambahkan pembersihan file yatim dengan dry-run dan masa tunggu.
- [ ] 09.09 [AUDIT] Buktikan batas ukuran, SHA-256, traversal path, dan attachment header pada adapter file.
- [ ] 09.10 [DECIDE] Tetapkan apakah signed link harus segera dicabut ketika sesi/membership dicabut.
- [ ] 09.11 [AUDIT] Buktikan expiry dan archival sesuai kebijakan; cegah signed URL tercatat di log.
- [ ] 09.12 [BUILD] Siapkan adapter object storage bersama sebelum menjalankan banyak instance.
- [ ] 09.13 [AUDIT] Periksa komentar/tag pada record terarsip dan referensi polymorphic yang hilang.
- [ ] 09.14 [BUILD] Tambahkan pagination komentar, notifikasi, activity, dan tag sesuai kebutuhan data.
- [ ] 09.15 [BUILD] Sediakan deep link notifikasi yang membuka record terkait pada tenant yang benar.
- [ ] 09.16 [FIX] Selaraskan dokumentasi metadata dokumen dengan upload/download yang sudah tersedia.
- [ ] 09.G [AUDIT] Gate: alur task + attachment + komentar + notifikasi lengkap, aksesnya benar, dan kegagalan file dapat dipulihkan.

## 10. CRM, sales, dan keuangan operasional

- [ ] 10.01 [AUDIT] Buktikan alur partner → opportunity → quote → order → invoice → payment.
- [ ] 10.02 [AUDIT] Periksa apakah opportunity dan quote harus memiliki partner yang sama.
- [ ] 10.03 [AUDIT] Periksa currency invoice terhadap order yang ditautkan.
- [ ] 10.04 [DECIDE] Tetapkan presisi uang, quantity, pajak, dan aturan pembulatan per tahap.
- [ ] 10.05 [BUILD] Gunakan aritmetika decimal atau satuan integer yang sesuai; audit konversi `Number()`.
- [ ] 10.06 [BUILD] Batasi hasil perkalian dan total sesuai kapasitas kolom database.
- [ ] 10.07 [AUDIT] Buktikan snapshot baris quote/order tetap sama setelah harga katalog berubah.
- [ ] 10.08 [AUDIT] Buktikan transisi quote terminal tidak membuat order kedua.
- [ ] 10.09 [DECIDE] Tetapkan aturan quote kedaluwarsa, invoice parsial, pembatalan, dan koreksi pembayaran.
- [ ] 10.10 [BUILD] Tambahkan idempotency pembayaran dengan tenant + key unik dan hash payload.
- [ ] 10.11 [BUILD] Kembalikan hasil sebelumnya untuk key dan payload yang sama.
- [ ] 10.12 [BUILD] Tolak key yang sama dengan payload berbeda.
- [ ] 10.13 [BUILD] Simpan payment, idempotency record, saldo/status invoice, dan audit dalam satu transaksi.
- [ ] 10.14 [AUDIT] Buktikan row lock mencegah overpayment pada request bersamaan.
- [ ] 10.15 [AUDIT] Buktikan timeout setelah commit tidak menyebabkan pembayaran ganda saat retry.
- [ ] 10.16 [BUILD] Pakai nomor dokumen unik yang memiliki strategi collision/retry jelas.
- [ ] 10.17 [AUDIT] Periksa konsistensi waktu mulai/selesai kalender saat create dan patch.
- [ ] 10.18 [BUILD] Tautkan bukti expense ke dokumen tenant yang valid.
- [ ] 10.19 [BUILD] Tampilkan rekonsiliasi invoice: amount, payment records, paid amount, dan sisa tagihan.
- [ ] 10.G [AUDIT] Gate: nominal, status, audit, dan retry konsisten pada alur bisnis lengkap; batas fitur keuangan dijelaskan di UI/dokumen.

## 11. DNA registry, UNILEX, dan migrasi legacy

- [ ] 11.01 [AUDIT] Inventaris import paket DNA lama dan konsumen registry dalam workspace.
- [ ] 11.02 [DECIDE] Tetapkan kompatibilitas yang dipertahankan: lookup alias, ID, format katalog, atau import paket.
- [ ] 11.03 [BUILD] Tulis panduan migrasi tiap import/format yang berubah.
- [ ] 11.04 [BUILD] Tambahkan dry-run generator yang menampilkan file diubah/dihapus.
- [ ] 11.05 [BUILD] Pisahkan penghapusan paket legacy menjadi langkah migrasi yang eksplisit dan dapat ditinjau.
- [ ] 11.06 [BUILD] Tolak penghapusan bila berkas legacy mengandung perubahan lokal yang belum direkonsiliasi.
- [ ] 11.07 [AUDIT] Buktikan generator deterministik dan tidak menyentuh berkas di luar daftar sasaran.
- [ ] 11.08 [AUDIT] Buktikan 99 record, ID/slug/alias unik, serta delapan reference-only sesuai kontrak.
- [ ] 11.09 [BUILD] Tampilkan status metadata/draft dan bukti implementasi capability secara terpisah.
- [ ] 11.10 [AUDIT] Pertahankan pemisahan seed UNILEX 71 konsep dan mapping DNA 99 record.
- [ ] 11.11 [AUDIT] Periksa dry-run importer dictionary, hash, record berubah/hilang, dan rerun.
- [ ] 11.12 [AUDIT] Buktikan tabel legacy tetap utuh dan compatibility fallback berfungsi.
- [ ] 11.13 [DECIDE] Tetapkan reviewer bahasa/sumber untuk crosswalk semantik sebelum canonical mapping.
- [ ] 11.G [AUDIT] Gate: konsumen dapat dimigrasikan dengan jelas, generator aman, dan tidak ada klaim metadata menjadi kemampuan runtime.

## 12. Command Center dan penyempurnaan pengalaman pengguna

- [ ] 12.01 [BUILD] Tampilkan tenant aktif dan indikator scope global pada layar terkait.
- [ ] 12.02 [BUILD] Sembunyikan/nonaktifkan aksi sesuai izin sambil mempertahankan penegakan izin di API.
- [ ] 12.03 [BUILD] Bedakan loading, kosong, gagal, partial, stale, dan belum terhubung pada setiap modul.
- [ ] 12.04 [AUDIT] Pastikan membuka atau me-refresh layar tidak memicu scan mahal tanpa aturan yang jelas.
- [ ] 12.05 [BUILD] Tampilkan status run dan progres sebenarnya setelah operator memicu scan.
- [ ] 12.06 [BUILD] Tampilkan "data terakhir berhasil" beserta waktunya ketika refresh gagal.
- [ ] 12.07 [BUILD] Sinkronkan filter, pagination, statistik, dan chart dengan sumber hitungan yang sama.
- [ ] 12.08 [BUILD] Batalkan/abaikan respons lama saat tenant atau filter berubah cepat.
- [ ] 12.09 [BUILD] Berikan respons UI pada `ok:false`, konflik, dan gagal persist meskipun HTTP berhasil.
- [ ] 12.10 [BUILD] Pecah layar Sentinel dan enterprise besar menjadi komponen yang mengikuti alur pengguna.
- [ ] 12.11 [AUDIT] Periksa chart/legenda dengan keyboard, label form, fokus modal, dan pembaca layar.
- [ ] 12.12 [BUILD] Seragamkan istilah, format waktu Asia/Jakarta untuk tampilan lokal, dan satuan pengukuran.
- [ ] 12.13 [BUILD] Tambahkan deep link ke project, kasus, sumber, dan run untuk berbagi konteks internal.
- [ ] 12.14 [BUILD] Sediakan ekspor sesuai scope/izin dengan provenance dan penanda data yang dipertahankan.
- [ ] 12.G [AUDIT] Gate: operator dapat memahami scope, kesegaran, status proses, dan hasil tanpa menebak.

## 13. Observability, pemulihan, dan performa

- [ ] 13.01 [BUILD] Ukur keberhasilan/failure/partial untuk ingest, scan, persist, dan outbox secara terpisah.
- [ ] 13.02 [BUILD] Ukur latency, umur data, panjang antrean, retry, penggunaan browser, dan ukuran tabel.
- [ ] 13.03 [DECIDE] Tetapkan target layanan dari baseline pengukuran, bukan angka tanpa bukti.
- [ ] 13.04 [BUILD] Gunakan log terstruktur dengan correlation ID dan data sensitif disamarkan.
- [ ] 13.05 [AUDIT] Hentikan timer dan tunggu pekerjaan aktif sebelum database ditutup saat shutdown.
- [ ] 13.06 [BUILD] Tambahkan status degraded yang menjelaskan komponen penyebabnya.
- [ ] 13.07 [AUDIT] Lakukan latihan sumber timeout, provider dibatasi, database terputus, disk penuh, dan worker restart.
- [ ] 13.08 [AUDIT] Ukur query dan pagination pada volume data yang mewakili target pilot.
- [ ] 13.09 [AUDIT] Buktikan backup database dan file dapat dipulihkan menjadi keadaan yang konsisten.
- [ ] 13.10 [BUILD] Tulis runbook untuk scan macet, outbox gagal, source stale, dan rollback migrasi.
- [ ] 13.11 [BUILD] Tambahkan pengendalian retensi dengan preview jumlah record/file yang akan dihapus.
- [ ] 13.12 [AUDIT] Periksa konfigurasi/secret produksi, rotasi signing secret, dan akses ke storage privat.
- [ ] 13.G [AUDIT] Gate: kegagalan terdeteksi, pekerjaan dapat dihentikan, dan pemulihan terbukti pada lingkungan uji.

## 14. Bukti penerimaan dan promosi rilis

- [ ] 14.01 [BUILD] Tautkan tiap gate paket ke bukti penerimaannya.
- [ ] 14.02 [AUDIT] Jalankan acceptance login → tenant → aksi → data → audit → UI untuk tiap alur berubah.
- [ ] 14.03 [AUDIT] Jalankan pemeriksaan negatif auth, tenant, payload invalid, dan data sintetis.
- [ ] 14.04 [AUDIT] Jalankan pemeriksaan concurrency/retry untuk payment, upload, partner link, dan scan.
- [ ] 14.05 [AUDIT] Periksa kontrak API serta migrasi pada database kosong dan database lama yang disalin dengan aman.
- [ ] 14.06 [AUDIT] Jalankan instalasi terkunci sesuai Node/pnpm repo: `pnpm install --frozen-lockfile`.
- [ ] 14.07 [AUDIT] Jalankan `pnpm validate` dan `pnpm module:test`.
- [ ] 14.08 [AUDIT] Jalankan `node --test scripts/tests/*.test.mjs` dan `pnpm exec turbo run test`.
- [ ] 14.09 [AUDIT] Jalankan `pnpm build` dan `pnpm typecheck`.
- [ ] 14.10 [AUDIT] Jalankan `pnpm audit --prod --audit-level high`; tangani temuan sesuai kebijakan repo.
- [ ] 14.11 [BUILD] Selaraskan quickstart, VALIDATION, tenancy, data contracts, roadmap, dan deployment checklist.
- [ ] 14.12 [AUDIT] Periksa Branch policy, Quality checks, dan CodeQL pada PR promosi.
- [ ] 14.13 [AUDIT] Kerjakan/commit pada `dev`; promosikan lewat PR `dev` ke `main` dengan merge commit.
- [ ] 14.14 [AUDIT] Setelah promosi, jalankan `git fetch origin` lalu merge `origin/main` ke `dev` sesuai AUTOMATION.md.
- [ ] 14.15 [AUDIT] Pertahankan `dev` dan `main`; tanpa branch tambahan, force-push, squash, atau rebase.
- [ ] 14.16 [AUDIT] Gunakan release tag sebagai ledger versi; hindari automated bump commit.
- [ ] 14.17 [AUDIT] Tulis catatan migrasi, keterbatasan, serta prosedur rollback untuk rilis tersebut.
- [ ] 14.G [AUDIT] Gate: required checks dan bukti alur lulus; promosi/deployment mengikuti keputusan rilis yang berlaku.

Rujukan proses: [AUTOMATION](AUTOMATION.md), [release gates](OPERATIONS_RELEASE_GATES.md), [World Monitor checklist](WORLD_MONITOR_DEPLOYMENT_CHECKLIST.md). Tidak ada jadwal deployment atau otomatisasi yang dibuat oleh dokumen ini.

## 15. Docker deploy infra — Compose tanpa reverse proxy

Target awal: deployment mandiri dengan Docker Compose, tanpa reverse proxy. Portal dan Command Center diakses pada port masing-masing; API hanya dipublikasikan ke alamat bind yang dipilih operator. Command Center dibangun dan dijalankan dengan Next.js agar stack frontend konsisten. Deployment produksi/provider dan migrasi otomatis belum termasuk.

- [x] 15.01 [AUDIT] Cocokkan Dockerfile dan Compose dengan workspace, lockfile, versi Node, dan output build yang benar.
- [ ] 15.02 [BUILD] Buat image API production yang memuat runtime yang diperlukan, berjalan non-root, menerima SIGTERM, dan menyertakan healthcheck.
- [ ] 15.03 [BUILD] Buat image Portal Next.js production dengan output standalone dan healthcheck.
- [x] 15.04 [BUILD] Migrasikan Command Center ke Next.js dengan route/page setara dan pertahankan API contract.
- [ ] 15.05 [BUILD] Buat image Command Center Next.js production; tentukan konfigurasi API origin yang benar untuk browser di luar host.
- [ ] 15.06 [BUILD] Satukan Postgres, API, Portal, dan Command Center dalam Compose; tanpa reverse proxy.
- [ ] 15.07 [AUDIT] Pastikan port dapat di-bind ke loopback secara default dan hanya layanan yang diperlukan dipublikasikan.
- [ ] 15.08 [BUILD] Sediakan contoh env tanpa rahasia; validasi password DB dan signing secret wajib sebelum start.
- [ ] 15.09 [AUDIT] Buktikan health/dependency order, volume database dan file, serta restart tidak menghapus data.
- [ ] 15.10 [BUILD] Dokumentasikan start/stop, update image, backup/restore DB+file, log, dan rollback.
- [ ] 15.11 [AUDIT] Buktikan `docker compose config`, build seluruh image, healthcheck, login, akses API dari kedua UI, dan persistensi setelah restart.
- [ ] 15.G [AUDIT] Gate: instalasi bersih dapat dijalankan operator dari dokumentasi, tidak memerlukan reverse proxy, data bertahan, dan prosedur backup/restore diuji.

Risiko deployment: browser harus dapat menjangkau API origin; nilai `localhost` hanya benar saat browser berjalan pada host Docker. Compose belum membuktikan TLS, DNS publik, backup terjadwal, rotasi rahasia, atau deployment high availability. Rate limit in-memory juga memerlukan shared store jika API direplikasi.

## 16. Ide liar — eksperimen kecil yang dapat dihentikan

Pilih maksimal dua ide. Untuk setiap ide: catat hipotesis, pemilik, batas waktu/biaya, data yang boleh digunakan, metrik keberhasilan, dan keputusan lanjut/hentikan. Gunakan data publik berizin atau dataset uji. Fitur berikut adalah usulan, belum diimplementasikan.

### X01. Mesin waktu kejadian

- [ ] X01.1 [SPIKE] Putar ulang satu kejadian selama 24 jam dari snapshot satu sumber.
- [ ] X01.2 [SPIKE] Tampilkan perubahan bukti, alert, dan keputusan operator pada timeline.
- [ ] X01.3 [AUDIT] Ukur waktu menemukan asal perubahan; selalu tampilkan waktu replay agar tidak dianggap live.

### X02. Ruang latihan kegagalan

- [ ] X02.1 [SPIKE] Sediakan tiga skenario demo: source mati, database lambat, dan data basi.
- [ ] X02.2 [SPIKE] Minta operator menyelesaikan satu tugas pemulihan pada tiap skenario.
- [ ] X02.3 [AUDIT] Ukur keberhasilan memahami gangguan; isolasikan injeksi dari lingkungan operasional.

### X03. Peta ketidakpastian

- [ ] X03.1 [SPIKE] Tampilkan cakupan sumber, data hilang, dan sumber yang bertentangan pada satu wilayah.
- [ ] X03.2 [SPIKE] Bandingkan keputusan pengguna dengan tampilan indikator tunggal.
- [ ] X03.3 [AUDIT] Ukur kemampuan mengenali informasi yang belum diketahui; jelaskan makna setiap indikator.

### X04. Laboratorium aturan Sentinel

- [ ] X04.1 [SPIKE] Jalankan dua versi heuristik pada dataset review yang sama tanpa mengubah aturan aktif.
- [ ] X04.2 [SPIKE] Tampilkan perubahan label, alasan, dan contoh false positive terbesar.
- [ ] X04.3 [AUDIT] Ukur precision/recall per kategori; versi baru perlu review sebelum diaktifkan.

### X05. Dossier bukti sekali susun

- [ ] X05.1 [SPIKE] Gabungkan sumber, cuplikan, waktu, keputusan, dan koreksi satu kasus menjadi draft.
- [ ] X05.2 [SPIKE] Bila memakai AI, wajibkan setiap klaim menunjuk bukti dan tandai bukti yang tidak tersedia.
- [ ] X05.3 [AUDIT] Ukur ketepatan kutipan serta waktu review; ekspor/publikasi tetap tindakan operator.

### X06. Radar korelasi lintas sumber

- [ ] X06.1 [SPIKE] Cari kedekatan waktu/lokasi antara dua jenis observasi pada satu dataset.
- [ ] X06.2 [SPIKE] Tampilkan tautan sebagai hipotesis dengan contoh yang bertentangan.
- [ ] X06.3 [AUDIT] Ukur kegunaan bagi reviewer; korelasi tidak diberi label hubungan sebab akibat.

### X07. Antrean perhatian adaptif

- [ ] X07.1 [SPIKE] Urutkan kasus menggunakan freshness, bukti, dan urgensi kejadian yang dapat dijelaskan.
- [ ] X07.2 [SPIKE] Sediakan alasan ranking dan koreksi prioritas secara manual.
- [ ] X07.3 [AUDIT] Bandingkan waktu penanganan dengan antrean biasa; jangan menilai identitas pribadi/keyakinan pengguna.

### X08. Jejak bukti yang dapat diverifikasi

- [ ] X08.1 [SPIKE] Ekspor manifest hash berkas/snapshot dan riwayat keputusan untuk satu kasus.
- [ ] X08.2 [SPIKE] Buat pemeriksa integritas lokal dengan format terbuka.
- [ ] X08.3 [AUDIT] Buktikan perubahan berkas terdeteksi; jelaskan bahwa hash tidak membuktikan kebenaran isi sumber.

### X09. Mode latihan operator

- [ ] X09.1 [SPIKE] Buat kasus sintetis berisi promosi, berita, satire, dan bantahan yang ambigu.
- [ ] X09.2 [SPIKE] Berikan umpan balik berdasarkan alasan reviewer dan konteks bukti.
- [ ] X09.3 [AUDIT] Ukur konsistensi review; dataset latihan tidak boleh masuk katalog nyata.

### X10. Brief pribadi berdasarkan perubahan

- [ ] X10.1 [SPIKE] Buat pratinjau ringkasan untuk satu wilayah/topik yang dipilih pengguna.
- [ ] X10.2 [SPIKE] Bandingkan ringkasan perubahan berarti dengan daftar seluruh kejadian.
- [ ] X10.3 [AUDIT] Ukur relevansi; pengiriman eksternal/berkala memerlukan opt-in dan aturan akses yang sudah selesai.

### X11. Workbench bukti menjadi pekerjaan

- [ ] X11.1 [SPIKE] Buat draft task tenant dari temuan yang sengaja dipilih operator.
- [ ] X11.2 [SPIKE] Pertahankan tautan dan snapshot sumber sambil membatasi salinan catatan privat.
- [ ] X11.3 [AUDIT] Ukur pengurangan input ulang; pembuatan/assignment final memerlukan konfirmasi operator.

### X12. Pencarian lintas modul yang paham izin

- [ ] X12.1 [SPIKE] Cari project, dokumen, partner, dan kasus pada satu tenant dengan keyword terlebih dulu.
- [ ] X12.2 [SPIKE] Tambahkan pencarian semantik hanya bila dataset dan evaluasi menunjukkan kebutuhan.
- [ ] X12.3 [AUDIT] Ukur keberhasilan pencarian dan kebocoran lewat hasil/cuplikannya, termasuk query lintas tenant.

### X13. Panel kemampuan yang punya bukti

- [ ] X13.1 [SPIKE] Hubungkan satu capability registry ke modul implementasi, batas perilaku, dan bukti penerimaan.
- [ ] X13.2 [SPIKE] Tampilkan draft, implemented, dan verified sebagai status berbeda.
- [ ] X13.3 [AUDIT] Buktikan metadata tanpa implementasi tidak terlihat aktif dan tidak memperoleh izin runtime.

### X14. Mode koneksi putus

- [ ] X14.1 [SPIKE] Tampilkan snapshot terakhir dengan usia data saat jaringan tidak tersedia.
- [ ] X14.2 [SPIKE] Simpan draft catatan lokal dengan batas masa simpan; sinkronisasi hanya setelah izin diperiksa ulang.
- [ ] X14.3 [AUDIT] Ukur keberhasilan pemulihan konflik; jangan menaruh token, signed link, atau isi restricted dalam cache umum.

### X15. Laboratorium skenario bisnis

- [ ] X15.1 [SPIKE] Simulasikan quote, pajak, pembayaran parsial, dan timeout pada dataset terpisah.
- [ ] X15.2 [SPIKE] Tampilkan dampak perubahan harga terhadap draft tanpa mengubah dokumen yang sudah diterbitkan.
- [ ] X15.3 [AUDIT] Ukur kesalahan perhitungan yang tertangkap; simulasi tidak menciptakan invoice/payment operasional.

## 17. Sepuluh pekerjaan pertama

Urutan ini adalah pintu masuk pelaksanaan; detail dan bukti tetap dicatat pada ID asal agar tidak ada dua sumber status.

1. 00.01–00.03: tetapkan baseline dan konfirmasi temuan.
2. 01.03–01.05: tutup akses anonim pada mutasi Sentinel.
3. 03.01–03.02: putuskan scope catatan/review dan hubungan role dengan tenant.
4. Sisa 01.01–01.10: tetapkan izin dan lindungi catatan serta detail temuan sesuai scope.
5. 02.01–02.08: hentikan pencampuran hasil sintetis dan siapkan karantina data lama setelah preflight serta restore terkait terbukti.
6. 03.07–03.08: perbaiki kontrak detail partner.
7. 04.01–04.04: satukan audit wajib dengan mutasi dan tambahkan audit Sentinel.
8. 06.01–06.07: benahi indikator alert World Monitor dan validasi parser/freshness.
9. 07.01–07.08: batasi scan serta catat hasil run dengan benar.
10. 10.10–10.15: lindungi pembayaran dari retry/duplikasi sambil mempertahankan row lock.

## 18. Milestone pelaksanaan dan status snapshot

Milestone berikut mengelompokkan ID yang sudah ada; satu checklist asal tetap menjadi sumber status. Urutkan berdasarkan dependensi dan blokir rilis saat gate paket terkait belum terbukti. Status di bawah adalah snapshot working tree `dev`, bukan klaim bahwa seluruh perubahan lokal sudah committed atau dipromosikan.

| Milestone | Checklist asal | Dependensi | Bukti selesai | Status snapshot |
| --- | --- | --- | --- | --- |
| M0 — Baseline dan CI bersih | 00.01–00.10, 00.G, 14.06–14.10 | Tidak ada | Commit/branch/perubahan lokal tercatat; semua gate automation pada commit yang sama lulus di CI | 00.01–.03 dan .08–.10 sudah diaudit pada `dev`/`4582801`; CI lokal lengkap lulus, CI perubahan terbaru belum berjalan di GitHub |
| M1 — Akses dan rate limit Sentinel | 01.01–01.15, 01.G | M0; 03.01–03.02 untuk keputusan scope detail | Tes anonim/izin/expired session, audit respons publik, uji 429/Retry-After dan batas concurrency; catat scope satu replica vs shared store | 01.03–01.14 dicentang pada working tree; 01.15, audit respons penuh, dan gate masih terbuka |
| M2 — Provenance dan World Monitor | 02.01–02.12, 06.01–06.18, 06.G, 07.01–07.18, 07.G | M0–M1; data/schema preflight sebelum migrasi | Fixture sumber/freshness, demo terisolasi, run parsial/gagal tercatat, scheduler bounded dan tanpa duplikasi | 02.01/.02 dan 06.01–.03 terbukti dengan test lokal; validasi parser, sejarah, scheduler penuh, dan gate masih terbuka |
| M3 — Docker Compose dan frontend konsisten | 15.01–15.11, 15.G; 12.01–12.14, 12.G | M0; M1 untuk API aman; preflight DB 05.01–05.04 dan restore 13.09 sebelum perubahan data | Build empat service, Compose config valid, Command Center Next.js, health/auth/API smoke, volume survive restart, restore+rollback terdokumentasi | Audit 15.01 dan migrasi 15.04 terbukti lokal; build framework terkait lulus. Docker runtime/config/volume/restore dan CI untuk paket Docker masih perlu dijalankan |
| M4 — Tenant, transaksi, dan alur operasional | 03.01–03.14, 03.G; 04.01–04.13, 04.G; 09.01–09.16, 09.G; 10.01–10.19, 10.G | M1; keputusan scope; 05.01–05.04; 13.09 | Tes lintas tenant negatif, audit atomik, upload/retry, rekonsiliasi invoice/payment, database lama dan baru | Belum terbukti oleh dokumen ini; semua gate terbuka |
| M5 — Registry, recovery, dan promosi | 05.01–05.11, 05.G; 11.01–11.13, 11.G; 13.01–13.12, 13.G; 14.01–14.17, 14.G | M0–M4 sesuai perubahan | Migrasi dry-run/rollback, restore DB+file, runbook, seluruh gate relevan, PR dev→main merge commit, sinkronisasi main ke dev | Belum terbukti oleh dokumen ini; eksperimen M6 tetap opsional |
| M6 — Eksperimen pilihan | Maksimal dua X01–X15 | Gate fondasi yang dipakai oleh eksperimen; biaya/waktu/pemilik/dataset ditetapkan | Hipotesis dan metrik sebelum spike; review hasil dan keputusan lanjut/hentikan | Belum dipilih; tidak memblokir fondasi |

### Milestone kecil yang bisa ditutup bertahap

Kerjakan satu baris per perubahan yang dapat direview. Jangan menandai gate induk selesai hanya karena beberapa sublangkah sudah lulus.

| Urutan | Checklist kecil | Hasil minimum | Status |
| --- | --- | --- | --- |
| S0.1 | 00.01–00.03 | Baseline commit/branch/worktree dan daftar pekerjaan lokal versus temuan review | Selesai; `dev`, `4582801`, 424 path berubah |
| S0.2 | 00.08–00.10 | Versi runtime, validasi source/schema/lockfile, dan audit secret/artifact | Selesai; Node 24.22.1, pnpm 11.24.0; frozen lockfile + validate lulus; `.env` ignored dan tidak dilacak |
| S0.3 | 14.06–14.10 | Jalankan seluruh gate lokal pada snapshot kerja | Selesai lokal: install terkunci, validate, module/release tests, turbo tests, build, typecheck, audit dependency; belum merupakan hasil CI GitHub |
| S1.1 | 01.13–01.14 | Rate limit rolling-window dan batas concurrency per operator/global; pastikan auth dahulu dan respons 429/503 membawa Retry-After | Implementasi + tes lokal lulus; state process-local, shared store diperlukan sebelum multi-replica |
| S1.2 | 01.10, 01.15, 01.G | Audit seluruh payload publik serta sesi revoked/expired dan izin detail | Belum mulai; blocker sebelum menyatakan akses Sentinel selesai |
| S2.1 | 06.01–06.03 | Status kejadian kritis tetap merah meskipun database sehat; kesehatan DB tetap field terpisah | Implementasi + tes regresi lokal lulus (API 18/18) |
| S2.2 | 06.04–06.07 | Fixture parser, NaN/tanggal/payload invalid, waktu observasi hilang dan freshness | Belum mulai |
| S3.1 | 15.01, 15.04 | Audit struktur Docker dan migrasi Command Center ke Next.js | Lulus lokal; UI/Portal/API build dan typecheck terkait lulus |
| S3.2 | 15.02–15.08 | Image tiga aplikasi, Compose services, loopback port, secret/env validation | Implementasi ada; belum bisa divalidasi karena Docker Engine tidak tersedia |
| S3.3 | 15.09–15.G | Health/auth smoke, volume persistence/restart, backup+restore runtime | Belum dibuktikan; wajib dijalankan di host yang memiliki Docker sebelum mengklaim deployment siap |
| S4.1 | 11.04–11.07 | Dry-run migrasi DNA, allowlist target, proteksi edit lokal, determinisme | Belum mulai; tahan stage/push perubahan penghapusan paket DNA sampai gate ini lulus |
| S4.2 | 03.01–03.08 | Putuskan tenant scope/role; tes isolasi tenant; detail partner 404 konsisten | Belum mulai |
| S4.3 | 04.01–04.G | Mutasi bisnis dan audit/outbox atomik serta retry aman | Belum mulai |
| S4.4 | 10.01–10.G | Quote→order→invoice→payment; presisi/idempotensi/concurrency | Belum mulai; jangan promosikan sebagai fitur keuangan tervalidasi |
| S5.1 | 13.09, 13.G | Latihan restore database dan berkas privat, hasil konsisten | Runbook ada; runtime restore belum diuji |
| S5.2 | 14.01–14.G | Validasi pada commit terpilih, PR dev→main, merge commit dan sinkronisasi | Menunggu paket perubahan yang sudah dipisah dan gate CI terkait |
| S6.1 | Pilih paling banyak dua X01–X15 | Hipotesis, dataset, batas biaya/waktu, metrik dan keputusan lanjut/hentikan | Opsional, belum dipilih |

### Status terverifikasi pada snapshot dokumen

- 01.03–01.14 dicentang pada working tree dengan tes auth dan rate limit; 01.15 pencabutan/kedaluwarsa, audit seluruh respons, dan gate 01.G masih terbuka. CI #305 lulus; run #303/#304 gagal karena mismatch test historis dan typo JSX, bukan karena rate limit.
- 02.01–02.02 dicentang sebelumnya dengan bukti test package World Monitor; provenance menyeluruh, audit record historis, dan gate 02.G masih terbuka.
- 06.01–06.03 memisahkan indikator database dari bahaya observasi dan menurunkan alert global berdasarkan alert: unknown tetap unknown, critical menjadi red, advisory/degradasi menjadi yellow, selainnya green. Regresi gempa kritis saat database sehat lulus di `pnpm --filter @empire/api test` (18/18); parser/freshness/history dan gate 06.G tetap terbuka.
- 15.01 audit workspace/Node/lockfile dan 15.04 migrasi Command Center Next.js sudah dicentang. Build/typecheck/test Command Center, build Portal, dan build/typecheck/test API lulus di working tree. Docker Engine tidak tersedia, sehingga image build, `docker compose config/up`, health/auth smoke dalam container, persistensi volume, serta restore runtime belum terbukti; checkbox image/runtime dan gate 15.G tetap kosong.
- Jangan menandai milestone selesai hanya karena CI hijau: bukti operasional seperti restore, akses lintas host, dan persistensi perlu dicatat sendiri.

### Catatan baseline dan promosi

- Snapshot audit: branch `dev`, commit `4582801`; terdapat 424 path berubah pada working tree saat baseline dicatat. Perubahan lokal mencakup beberapa pekerjaan lama dan bukan satu paket grandplan yang sudah direview.
- Runtime repository: Node `24.22.1` (`.node-version`) dan pnpm `11.24.0` (`packageManager`). Install terkunci, `pnpm validate`, `pnpm module:test`, tes release, tes workspace, build, typecheck, audit dependency produksi, serta `git diff --check` lulus lokal.
- `.env` ditemukan sebagai file lokal tetapi di-ignore (`.env` dan `.env.*`); `var/`, dependency, dan hasil build juga di-ignore. Tidak ada file tersebut tampil sebagai perubahan Git. File database lokal tidak dibaca atau disentuh.
- Temuan CI: run historis #305 pada commit acuan lulus; #303/#304 gagal karena mismatch test historis dan typo JSX. Tidak ada bukti kegagalan CI akibat rate limit: fitur rate limit justru belum ada pada saatnya. Job CI Docker baru di working tree belum dibuktikan GitHub.
- Push setiap commit ke `dev` otomatis menerbitkan GitHub Release berdasarkan [AUTOMATION](AUTOMATION.md). Karena 424 path bercampur, penghapusan DNA belum melewati dry-run/guard, dan beberapa file menyatukan beberapa fitur, jangan stage luas atau push sampai paket koheren dipisah, direview, dan gate yang relevan lulus.

## Catatan bukti per unit kerja

Salin format ini saat mulai mengerjakan sebuah ID:

```text
ID:
Penanggung jawab:
Reviewer:
Dependensi:
Skenario sebelum perubahan:
Hasil yang diterima:
Bukti kode/dokumen:
Bukti pemeriksaan:
Dampak data dan rollback:
Keterbatasan/pekerjaan tersisa:
Status: belum dimulai | berlangsung | perlu keputusan | selesai dengan bukti
```
