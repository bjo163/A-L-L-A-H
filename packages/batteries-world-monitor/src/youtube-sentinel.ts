import { existsSync } from "node:fs";
import type {
  CounterDakwahBrief,
  SentinelDirection,
  SentinelTradition,
  TauhidGuidance,
  WisdomBrief,
  WisdomGuidance,
  YoutubeAmplifyPacket,
  YoutubeMatchedRule,
  YoutubeMonitoredItem,
  YoutubePositiveCategory,
  YoutubeReportPacket,
  YoutubeRiskLevel,
  YoutubeScanQuery,
  YoutubeScanResult,
  YoutubeScanSummary,
  YoutubeSortBy,
  YoutubeViolationCategory,
  YoutubeWorkflowStatus,
} from "./types.js";

// Deterministic Non-AI Heuristic Rule Matrix for Tauhid Protection
interface HeuristicRuleDefinition {
  id: string;
  category: YoutubeViolationCategory;
  label: string;
  weight: number;
  regex: RegExp;
}
const HEURISTIC_RULES: HeuristicRuleDefinition[] = [
  // 1. Sihir, Santet & Pelet
  {
    id: "RULE_SIHIR_SANTET_DIRECT",
    category: "SIHIR_PELET",
    label: "Praktik Santet & Teluh Gaib",
    weight: 50,
    regex: /\b(santet|santet\s+jarak\s+jauh|teluh|guna-guna|teluh\s+banyuwangi|kirim\s+santet)\b/i,
  },
  {
    id: "RULE_SIHIR_PELET_MAHABBAH",
    category: "SIHIR_PELET",
    label: "Ilmu Pelet & Pemikat Lawan Jenis",
    weight: 45,
    regex: /\b(pelet|pelet\s+jaran\s+goyang|semar\s+mesem|pelet\s+marongge|puter\s+giling|pasang\s+susuk|susuk\s+emas|susuk\s+pemikat)\b/i,
  },


  // 2. Dukun, Paranormal & Ramalan Nasib
  {
    id: "RULE_DUKUN_PARANORMAL_KONSULTASI",
    category: "DUKUN_RAMALAN",
    label: "Klaim Dukun Sakti / Orang Pintar",
    weight: 35,
    regex: /\b(dukun\s+sakti|paranormal\s+terpercaya|orang\s+pintar\s+ampuh|ki\s+prana|mbah\s+dukun|ahli\s+spiritual\s+gaib)\b/i,
  },
  {
    id: "RULE_RAMALAN_TAROT_INDIGO",
    category: "DUKUN_RAMALAN",
    label: "Ramalan Nasib / Tarot / Penerawangan",
    weight: 30,
    regex: /\b(ramalan\s+nasib|baca\s+kartu\s+tarot|terawangan\s+jodoh|indigo\s+melihat\s+masa\s+depan|ramalan\s+zodiak\s+akurat|terawang\s+masa\s+depan)\b/i,
  },

  // 3. Pesugihan & Tumbal
  {
    id: "RULE_PESUGIHAN_UANG_GAIB",
    category: "PESUGIHAN_TUMBAL",
    label: "Pesugihan Uang Gaib / Bank Gaib",
    weight: 50,
    regex: /\b(pesugihan|uang\s+gaib|tarik\s+uang\s+gaib|dana\s+hibah\s+gaib|bank\s+gaib|pesugihan\s+tanpa\s+tumbal|pesugihan\s+putih)\b/i,
  },
  {
    id: "RULE_PESUGIHAN_TUMBAL_JIN",
    category: "PESUGIHAN_TUMBAL",
    label: "Ritual Pesugihan & Tumbal Iblis",
    weight: 50,
    regex: /\b(tuyul\s+pesugihan|babi\s+ngepet|pesugihan\s+nyi\s+blorong|pesugihan\s+kandang\s+bubrah|perjanjian\s+iblis\s+kaya|tumbal\s+pesugihan)\b/i,
  },

  // 4. Khodam & Pemanggilan Jin
  {
    id: "RULE_KHODAM_PENDAMPING_ISI",
    category: "KHODAM_JIN",
    label: "Pengisian & Cek Khodam Jin",
    weight: 35,
    regex: /\b(cek\s+khodam|pengisian\s+khodam|khodam\s+macan\s+putih|khodam\s+pendamping|transfer\s+khodam|khodam\s+leluhur|aktifkan\s+khodam)\b/i,
  },
  {
    id: "RULE_PEMANGGILAN_JIN_MEDIASI",
    category: "KHODAM_JIN",
    label: "Pemanggilan Jin & Mediumisasi Mistis",
    weight: 30,
    regex: /\b(panggil\s+jin|mediumisasi\s+jin|komunikasi\s+alam\s+gaib|penampakan\s+jin\s+khodam|perjanjian\s+jin)\b/i,
  },

  // 5. Benda Bertuah, Mustika & Jimat
  {
    id: "RULE_JIMAT_KEBAL_PUSAKA",
    category: "BENDA_KERAMAT_JIMAT",
    label: "Jimat Kekebalan & Keris Bertuah",
    weight: 35,
    regex: /\b(jimat\s+kebal|kebal\s+bacok|keris\s+sakti\s+mandraguna|keris\s+bertuah|wafak\s+kebal|sabuk\s+rajah|rajah\s+kebal)\b/i,
  },
  {
    id: "RULE_MUSTIKA_BENDA_TARIKAN",
    category: "BENDA_KERAMAT_JIMAT",
    label: "Batu Mustika Gaib & Minyak Pelet",
    weight: 30,
    regex: /\b(batu\s+mustika|merah\s+delima\s+asli|mustika\s+kelapa|minyak\s+mani\s+gajah|minyak\s+pelet\s+asli|tarik\s+benda\s+pusaka)\b/i,
  },

  // 6. Makam Keramat & Larung Sesajen
  {
    id: "RULE_NGALAP_BERKAH_MAKAM",
    category: "KUBURAN_SESAJEN",
    label: "Ngalap Berkah Makam / Minta Nomor",
    weight: 35,
    regex: /\b(ngalap\s+berkah|makam\s+keramat\s+minta\s+rezeki|minta\s+nomor\s+kuburan|ziarah\s+minta\s+kaya|petilasan\s+keramat\s+pesugihan)\b/i,
  },
  {
    id: "RULE_LARUNG_SESAJEN_PANTAI",
    category: "KUBURAN_SESAJEN",
    label: "Larung Sesaji Penguasa Laut / Gunung",
    weight: 40,
    regex: /\b(larung\s+sesaji|sesajen\s+pantai\s+selatan|persembahan\s+kepala\s+kerbau|sesajen\s+ratu\s+kidul|ritual\s+gunung\s+kawi)\b/i,
  },

  // 7. Praktik Klenik Berkedok Agama / Syirik Kontemporer
  {
    id: "RULE_DUKUN_KEDOK_AGAMA",
    category: "UMUM_SYIRIK",
    label: "Dukun / Supranatural Berkedok Karomah / Gelar Agama",
    weight: 40,
    regex: /\b(ustadz\s+sakti|kyai\s+paranormal|gus\s+sakti|ilmu\s+laduni\s+instan|wirid\s+penarik\s+uang\s+milyaran|ijazah\s+uang\s+gaib|amalan\s+pesugihan)\b/i,
  },
  {
    id: "RULE_RAMALAN_WETON_JODOH_KEMATIAN",
    category: "DUKUN_RAMALAN",
    label: "Hitungan Weton Mistis & Ramalan Sial / Kematian",
    weight: 30,
    regex: /\b(ramalan\s+weton\s+jodoh|weton\s+pembawa\s+sial|ruwatan\s+buang\s+sial|ruwat\s+sengkolo|mandi\s+kembang\s+buang\s+sial|hari\s+naas\s+weton)\b/i,
  },
  {
    id: "RULE_PENASIHAT_SPIRITUAL_TRANSFER_ENERGI",
    category: "UMUM_SYIRIK",
    label: "Transfer Energi Gaib / Buka Aura Mistis",
    weight: 35,
    regex: /\b(buka\s+aura\s+pengasihan|transfer\s+energi\s+gaib|pengijazahan\s+ilmu\s+kebal|mandi\s+aura\s+pemikat|penyelerasan\s+khodam)\b/i,
  },
];

// Commercial / Practitioner Modifiers (Boosts severity)
const TRANSACTIONAL_MODIFIERS = [
  { label: "Permintaan Mahar / Tarif Gaib", regex: /\b(mahar\s+seikhlasnya|mahar\s+tingkat|biaya\s+mahar|transfer\s+mahar|mahar\s+kesepakatan|kirim\s+uang\s+gaib|dana\s+hibah\s+gaib|uang\s+balik|bank\s+gaib)\b/i, boost: 20 },
  { label: "Layanan Jarak Jauh / Hubungi Kontak / WhatsApp", regex: /\b(hubungi\s+wa|wa\s+08|wa\.me\/\d+|\+?62\s?8\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,5}|jarak\s+jauh\s+ampuh|konsultasi\s+wa|dm\s+instagram|admin\s+pendaftaran\s+wa|chat\s+whatsapp|wa\s+mbah|wa\s+ki|kontak\s+padepokan)\b/i, boost: 25 },
  { label: "Jaminan Pasti Berhasil / Garansi Gaib", regex: /\b(dijamin\s+ampuh|garansi\s+uang\s+kembali|pasti\s+cair|100%\s+berhasil|langsung\s+terbukti|terbukti\s+nyata|langsung\s+reaksi|reaksi\s+seketika|paten|hajat\s+terkabul\s+sekejap)\b/i, boost: 15 },
  { label: "Klaim Tanpa Resiko / Tanpa Tumbal Palsu", regex: /\b(tanpa\s+tumbal|aman\s+tanpa\s+efek\s+samping|pesugihan\s+halal|pesugihan\s+putih\s+islami|khodam\s+putih\s+tanpa\s+pantangan|mustika\s+tanpa\s+pantangan)\b/i, boost: 15 },
];

// Anti False-Positive: Refutation, Educational & Syar'i Counter Markers
const DAKWAH_REFUTATION_MARKERS = [
  { label: "Bantahan Bahaya Syirik", regex: /\b(bahaya\s+syirik|hukum\s+syirik|dosa\s+syirik|syirik\s+akbar|syirik\s+asghar|pembatal\s+keislaman|pemurnian\s+tauhid|merusak\s+akidah)\b/i },
  { label: "Membongkar Trik Penipuan Dukun", regex: /\b(membongkar\s+trik|bongkar\s+trik|penipuan\s+dukun|trik\s+santet|bongkar\s+rahasia\s+dukun|pesugihan\s+palsu|pesulap\s+merah|bongkar\s+kedok|modus\s+penipuan\s+penggandaan|waspada\s+modus|korban\s+penipuan\s+gaib)\b/i },
  { label: "Ruqyah Syar'iyyah & Penawar Sihir", regex: /\b(ruqyah\s+syar'iyyah|ruqyah\s+mandiri|ayat\s+penawar\s+sihir|cara\s+menghilangkan\s+santet\s+secara\s+islami|terapi\s+al-quran|bacaan\s+ruqyah|mengusir\s+jin\s+secara\s+syar'i)\b/i },
  { label: "Kajian Ustadz / Sunnah / Tokoh Resmi", regex: /\b(ustadz|kajian\s+sunnah|fatwa\s+mui|buya\s+yahya|ustadz\s+khalid|ustadz\s+adi\s+hidayat|syafiq\s+riza|firanda|ceramah\s+tauhid|kajian\s+islam|tanya\s+jawab\s+islam|penceramah\s+resmi|dakwah\s+islamiyah)\b/i },
  { label: "Peringatan Waspada Penipuan", regex: /\b(awas\s+tertipu|jangan\s+percaya\s+dukun|larangan\s+memakai\s+jimat|taubat\s+dari\s+sihir|hukum\s+mendatangi\s+tukang\s+ramal|jauhi\s+khurafat)\b/i },
  { label: "Klarifikasi / Berita Kriminal Perdukunan", regex: /\b(polisi\s+tangkap\s+dukun|dukun\s+ditangkap|korban\s+penipuan\s+dukun|kasus\s+dukun\s+cabul|modus\s+dukun|reskrim|sidang\s+kasus\s+pesugihan|vonis\s+dukun|polres|polda)\b/i },
];

// Quran & Sunnah Theological Dalil Matrix
const TAUHID_DALIL_MATRIX: Partial<Record<YoutubeViolationCategory, TauhidGuidance>> = {
  SIHIR_PELET: {
    topic: "Keharaman Sihir, Santet, dan Pelet",
    dalilRef: "QS. Al-Baqarah: 102 & QS. Thaha: 69",
    arabicText: "وَلَا يُفْلِحُ السَّاحِرُ حَيْثُ أَتَىٰ",
    translation: "Dan tidak akan menang tukang sihir itu, dari mana pun ia datang.",
    theologicalPrinciple: "Sihir adalah kekufuran nyata yang merusak ikatan Tauhid. Manfaat dan mudarat mutlak di tangan ALLAH semata.",
    recommendedAction: "Buat laporan pelarangan konten sihir dan sebarluaskan ruqyah syar'iyyah sebagai penangkal syar'i.",
  },
  DUKUN_RAMALAN: {
    topic: "Larangan Mendatangi dan Mempercayai Dukun / Peramal",
    dalilRef: "HR. Muslim No. 2230 & HR. Abu Dawud No. 3904",
    arabicText: "مَنْ أَتَى عَرَّافًا فَسَأَلَهُ عَنْ شَيْءٍ لَمْ تُقْبَلْ لَهُ صَلَاةٌ أَرْبَعِينَ لَيْلَةً",
    translation: "Barangsiapa mendatangi tukang ramal lalu menanyakan sesuatu, maka shalatnya tidak diterima selama 40 malam.",
    theologicalPrinciple: "Pengetahuan perkara gaib masa depan hanya milik ALLAH (Al-'Alim & Al-Khabir). Klaim peramal adalah kedustaan.",
    recommendedAction: "Edukasi umat bahwa zodiak, weton ramalan, dan kartu tarot membatalkan pahala ibadah.",
  },
  PESUGIHAN_TUMBAL: {
    topic: "Kesesatan Pesugihan, Perjanjian Iblis, dan Tumbal",
    dalilRef: "QS. Al-An'am: 162 & QS. Al-Jin: 6",
    arabicText: "قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "Katakanlah: Sesungguhnya shalatku, ibadahku, hidupku dan matiku hanyalah untuk ALLAH, Tuhan semesta alam.",
    theologicalPrinciple: "Mencari rezeki melalui tumbal dan makhluk halus merupakan bentuk peribadatan kepada selain ALLAH (Syirik Akbar). Rezeki telah dijamin Ar-Razzaq.",
    recommendedAction: "Laporkan channel penipuan dana gaib ke YouTube dan Cyber Crime Polri atas delik penipuan finansial berbasis klenik.",
  },
  KHODAM_JIN: {
    topic: "Larangan Menjadikan Jin Sebagai Pelindung / Khodam",
    dalilRef: "QS. Al-Jin: 6 & QS. Al-Isra: 70",
    arabicText: "وَأَنَّهُ كَانَ رِجَالٌ مِّنَ الْإِنسِ يَعُوذُونَ بِرِجَالٍ مِّنَ الْجِنِّ فَزَادُوهُمْ رَهَقًا",
    translation: "Dan sesungguhnya ada beberapa orang laki-laki dari kalangan manusia yang meminta perlindungan kepada jin, tetapi jin itu menjadikan mereka makin tersesat.",
    theologicalPrinciple: "Manusia dimuliakan ALLAH. Bergantung pada jin pelindung merendahkan martabat dan menjerumuskan pada kesyirikan.",
    recommendedAction: "Bantah tren cek khodam online dengan penanaman Tauhid Al-Wakil (ALLAH sebaik-baik pelindung).",
  },
  BENDA_KERAMAT_JIMAT: {
    topic: "Keharaman Menggantungkan Jimat (Tama'im) dan Wafak",
    dalilRef: "HR. Ahmad No. 17458 & HR. Abu Dawud No. 3883",
    arabicText: "مَنْ عَلَّقَ تَمِيمَةً فَقَدْ أَشْرَكَ",
    translation: "Barangsiapa menggantungkan jimat, sungguh dia telah berbuat syirik.",
    theologicalPrinciple: "Benda mati (keris, mustika, wafak) tidak memiliki daya cipta maupun perlindungan mandiri. Kekuatan mutlak hanya milik Al-Qawiyy Al-Matin.",
    recommendedAction: "Himbau pemusnahan jimat dan kembali bertawakal penuh kepada ALLAH (Hasbunallah wa ni'mal wakil).",
  },
  KUBURAN_SESAJEN: {
    topic: "Larangan Sesajen dan Meminta Rezeki di Makam Keramat",
    dalilRef: "QS. Al-Hajj: 73 & QS. Fatir: 14",
    arabicText: "إِن تَدْعُوهُمْ لَا يَسْمَعُوا دُعَاءَكُمْ وَلَوْ سَمِعُوا مَا اسْتَجَابُوا لَكُمْ",
    translation: "Jika kamu menyeru mereka, mereka tidak mendengar seruanmu; dan sekiranya mendengar, mereka tidak dapat memperkenankannya bagimu.",
    theologicalPrinciple: "Doa dan persembahan sembelihan hanyalah hak ALLAH. Mengarahkan sesaji kepada laut atau penghuni kubur merusak Tauhid Uluhiyyah.",
    recommendedAction: "Serukan gerakan sedekah laut diubah menjadi doa syukur kepada ALLAH dan bakti sosial masyarakat pesisir.",
  },
  UMUM_SYIRIK: {
    topic: "Menjaga Kemurnian Tauhid dari Segala Kesyirikan",
    dalilRef: "QS. Luqman: 13",
    arabicText: "إِنَّ الشِّرْكَ لَظُلْمٌ عَظِيمٌ",
    translation: "Sesungguhnya menyekutukan (ALLAH) adalah benar-benar kezaliman yang besar.",
    theologicalPrinciple: "Tauhid adalah pondasi seluruh amal perbuatan. Kesyirikan menggugurkan amal saleh.",
    recommendedAction: "Tingkatkan literasi Tauhid dan kuatkan benteng akidah keluarga dari tayangan takhayul.",
  },
  BEBAS_SYIRIK: {
    topic: "Konten Bebas Indikasi Kemusyrikan",
    dalilRef: "QS. Al-Ikhlas: 1-4",
    arabicText: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    translation: "Katakanlah: Dialah ALLAH, Yang Maha Esa.",
    theologicalPrinciple: "Konten bersih dari unsur kesyirikan dan selaras dengan prinsip akal sehat dan Tauhid.",
    recommendedAction: "Tidak diperlukan tindakan pembatasan.",
  },
};

// Positive Wisdom & Virtue Rules (Direction = POSITIVE)
interface PositiveWisdomRuleDefinition {
  id: string;
  category: YoutubePositiveCategory;
  tradition: SentinelTradition;
  label: string;
  regex: RegExp;
  weight: number;
}

const POSITIVE_WISDOM_RULES: PositiveWisdomRuleDefinition[] = [
  // 1. Tauhid & Dakwah Islam
  {
    id: "RULE_POS_TAUHID_ISLAM",
    category: "TAUHID_DAKWAH",
    tradition: "ISLAM",
    label: "Dakwah Pemurnian Tauhid & Sunnah",
    regex: /\b(kajian\s+tauhid|kemurnian\s+tauhid|makna\s+laa\s+ilaha\s+illallah|tauhid\s+rububiyah|tauhid\s+uluhiyah|asma\s+wa\s+sifat|mengenal\s+allah|mentauhidkan\s+allah)\b/i,
    weight: 40,
  },
  {
    id: "RULE_POS_AKHLAK_ISLAM",
    category: "AKHLAK_KARIMAH",
    tradition: "ISLAM",
    label: "Pendidikan Akhlak Karimah & Adab",
    regex: /\b(akhlak\s+mulia|akhlak\s+karimah|adab\s+penuntut\s+ilmu|birrul\s+walidain|berbakti\s+pada\s+orang\s+tua|menjaga\s+lisan|keutamaan\s+sabar|ikhlas\s+beramal)\b/i,
    weight: 35,
  },
  // 2. Kasih Kristiani & Khotbah Moral
  {
    id: "RULE_POS_KASIH_KRISTIANI",
    category: "KASIH_KRISTIANI",
    tradition: "KRISTEN",
    label: "Khotbah Moral Kasih Kristiani & Pengharapan",
    regex: /\b(khotbah\s+kristen|kasih\s+agape|hukum\s+kasih|renungan\s+kristen|khotbah\s+minggu|buah\s+roh|pengampunan\s+dan\s+kasih|kesetiaan\s+tuhan|roti\s+hidup)\b/i,
    weight: 35,
  },
  // 3. Dharma Hindu
  {
    id: "RULE_POS_DHARMA_HINDU",
    category: "DHARMA_HINDU",
    tradition: "HINDU",
    label: "Ajaran Kebajikan Dharma & Karma Phala",
    regex: /\b(ajaran\s+dharma|karma\s+phala|tri\s+kaya\s+parisudha|tat\s+twam\s+asi|dharma\s+wacana|moksa|bhagavad\s+gita\s+indonesia)\b/i,
    weight: 35,
  },
  // 4. Dharma Buddha
  {
    id: "RULE_POS_DHARMA_BUDDHA",
    category: "DHARMA_BUDDHA",
    tradition: "BUDDHA",
    label: "Kebijaksanaan Jalan Utama Berunsur Delapan",
    regex: /\b(dhammadesana|dhammapada|jalan\s+mulia\s+berunsur\s+delapan|metta\s+karuna|meditasi\s+vipassana|cinta\s+kasih\s+universal|kebijaksanaan\s+buddha)\b/i,
    weight: 35,
  },
  // 5. Khonghucu
  {
    id: "RULE_POS_KHONGHUCU",
    category: "KEBAJIKAN_KHONGHUCU",
    tradition: "KHONGHUCU",
    label: "Kebajikan Ren & Li (Kemanusiaan dan Kesusilaan)",
    regex: /\b(kebajikan\s+ren|ajaran\s+kesusilaan\s+li|budi\s+pekerti\s+khonghucu|jalan\s+suci\s+dao|moral\s+kebajikan\s+khonghucu)\b/i,
    weight: 35,
  },
  // 6. Universal
  {
    id: "RULE_POS_UNIVERSAL_HIKMAH",
    category: "UNIVERSAL_HIKMAH",
    tradition: "UNIVERSAL",
    label: "Pemberdayaan Moral & Kebijaksanaan Hidup Universal",
    regex: /\b(kebijaksanaan\s+hidup|falsafah\s+moral|kejujuran\s+integritas|menemukan\s+kedamaian\s+jiwa|filosofi\s+kebajikan|pemberdayaan\s+budi\s+pekerti)\b/i,
    weight: 30,
  },
];

// Matrix of Wisdom Guidance for POSITIVE items
const WISDOM_GUIDANCE_MATRIX: Record<YoutubePositiveCategory, WisdomGuidance> = {
  TAUHID_DAKWAH: {
    tradition: "ISLAM",
    topic: "Pemurnian Tauhid & Keikhlasan Beribadah",
    scriptureRef: "QS. Al-Ikhlas: 1-4 & QS. Adz-Dzariyat: 56",
    originalText: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
    translation: "Dan Aku tidak menciptakan jin dan manusia melainkan supaya mereka mengabdi kepada-Ku.",
    coreValue: "Tauhid Murni, Ikhlas, Menjauhi Kemusyrikan, Ketenangan Jiwa Bersama Allah",
    recommendedAction: "Amplify ke umat: sebarkan kajian ini sebagai rujukan literasi akidah yang kokoh.",
  },
  AKHLAK_KARIMAH: {
    tradition: "ISLAM",
    topic: "Keteladanan Akhlak & Budi Pekerti Luhur",
    scriptureRef: "HR. At-Tirmidzi No. 2003",
    originalText: "إِنَّمَا بُعِثْتُ لِأُتَمِّمَ صَالِحَ الْأَخْلَاقِ",
    translation: "Sesungguhnya aku diutus hanyalah untuk menyempurnakan kesalehan akhlak.",
    coreValue: "Santun, Kejujuran, Birrul Walidain, Kasih Sayang Antar Sesama",
    recommendedAction: "Jadikan referensi pendidikan keluarga dan kurikulum karakter generasi muda.",
  },
  KASIH_KRISTIANI: {
    tradition: "KRISTEN",
    topic: "Khotbah Kasih Agape & Pengharapan",
    scriptureRef: "1 Korintus 13:13 & Matius 22:37-39",
    originalText: "νυνὶ δὲ μένει πίστις, ἐλπίς, ἀγάπη, τὰ τρία ταῦτα· μείζων δὲ τούτων ἡ ἀγάπη.",
    translation: "Demikianlah tinggal ketiga hal ini, yaitu iman, pengharapan dan kasih, dan yang paling besar di antaranya ialah kasih.",
    coreValue: "Kasih Tanpa Pamrih, Pengampunan, Perdamaian, Pengharapan yang Teguh",
    recommendedAction: "Rekomendasikan sebagai teladan kerukunan, kesantunan bertutur kata, dan kasih sesama.",
  },
  DHARMA_HINDU: {
    tradition: "HINDU",
    topic: "Ajaran Kebenaran Dharma & Tri Kaya Parisudha",
    scriptureRef: "Bhagavad Gita 4.7-8 & Sarasamuccaya",
    originalText: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥",
    translation: "Kapan pun kebajikan (dharma) merosot dan kejahatan merajalela, saat itulah Aku menjelma.",
    coreValue: "Pikiran Baik, Perkataan Baik, Perbuatan Baik (Tri Kaya Parisudha)",
    recommendedAction: "Petik hikmah kebajikan moral dan pentingnya menjaga keseimbangan semesta.",
  },
  DHARMA_BUDDHA: {
    tradition: "BUDDHA",
    topic: "Cinta Kasih Universal (Metta Karuna) & Pengendalian Diri",
    scriptureRef: "Dhammapada Yamakavagga & Karaniya Metta Sutta",
    originalText: "न हि वेरेन वेरानि सम्मन्तीध कुदाचनं। अवेरेन च सम्मन्ति एस धम्मो सनन्तनो॥",
    translation: "Kebencian tidak akan pernah berakhir bila dibalas dengan kebencian. Hanya dengan cinta kasih kebencian akan berakhir.",
    coreValue: "Pengendalian Pikiran, Cinta Kasih Tanpa Batas, Kewaspadaan Batin",
    recommendedAction: "Simpan sebagai referensi keteduhan jiwa dan penawar amarah publik.",
  },
  KEBAJIKAN_KHONGHUCU: {
    tradition: "KHONGHUCU",
    topic: "Keluhuran Budi Pekerti (Ren) & Kesusilaan (Li)",
    scriptureRef: "Lun Yu (Sabda Suci Confucius)",
    originalText: "己所不欲，勿施于人",
    translation: "Apa yang tidak kau inginkan terjadi pada dirimu, jangan perbuat kepada orang lain.",
    coreValue: "Tenggang Rasa (Shu), Bakti kepada Orang Tua (Xiao), Integritas Moral",
    recommendedAction: "Jadikan rujukan etika sosial dan penghormatan terhadap orang tua.",
  },
  UNIVERSAL_HIKMAH: {
    tradition: "UNIVERSAL",
    topic: "Kebijaksanaan Moral, Kejujuran, & Integritas Kemanusiaan",
    scriptureRef: "Universal Human Wisdom",
    translation: "Hati yang damai dan hidup yang jujur adalah kekayaan terbesar manusia.",
    coreValue: "Integritas, Kejujuran, Kerendahan Hati, Kemanusiaan yang Adil",
    recommendedAction: "Arsipkan sebagai inspirasi umum kebaikan tanpa sekat.",
  },
};

/**
 * Analyzes video title, channel, and description snippet using deterministic heuristic rules.
 * Supports dual-direction: NEGATIVE (deviation / superstition) and POSITIVE (virtue / wisdom).
 */
export function evaluateVideoText(params: {
  title: string;
  description?: string;
  channelTitle?: string;
  transcript?: string;
}): {
  direction: SentinelDirection;
  tradition: SentinelTradition;
  category: YoutubeViolationCategory;
  riskLevel: YoutubeRiskLevel;
  riskScore: number;
  isRefutation: boolean;
  matchedRules: YoutubeMatchedRule[];
  transcriptExcerpt?: string;
  positiveCategory?: YoutubePositiveCategory;
} {
  const corpus = `${params.title} ${params.description ?? ""} ${params.channelTitle ?? ""} ${params.transcript ?? ""}`.trim();
  const matchedRules: YoutubeMatchedRule[] = [];
  const categoryScores: Partial<Record<YoutubeViolationCategory, number>> = {};

  // 1. Check for refutation / dakwah counter markers
  let refutationScore = 0;
  for (const marker of DAKWAH_REFUTATION_MARKERS) {
    if (marker.regex.test(corpus)) {
      refutationScore += 30;
      matchedRules.push({
        ruleId: "DAKWAH_REFUTATION_MARKER",
        category: "BEBAS_SYIRIK",
        pattern: marker.regex.source,
        weight: -25,
        label: marker.label,
        excerpt: marker.label,
      });
    }
  }

  // 2. Evaluate violation heuristic rules (NEGATIVE direction)
  for (const rule of HEURISTIC_RULES) {
    const match = rule.regex.exec(corpus);
    if (match) {
      matchedRules.push({
        ruleId: rule.id,
        category: rule.category,
        pattern: rule.regex.source,
        weight: rule.weight,
        label: rule.label,
        excerpt: match[0],
      });
      categoryScores[rule.category] = (categoryScores[rule.category] ?? 0) + rule.weight;
    }
  }

  // 3. Evaluate commercial / practitioner modifiers
  let transactionalBoost = 0;
  for (const mod of TRANSACTIONAL_MODIFIERS) {
    const match = mod.regex.exec(corpus);
    if (match) {
      transactionalBoost += mod.boost;
      matchedRules.push({
        ruleId: "TRANSACTIONAL_PRACTITIONER_BOOST",
        category: "UMUM_SYIRIK",
        pattern: mod.regex.source,
        weight: mod.boost,
        label: mod.label,
        excerpt: match[0],
      });
    }
  }

  // 4. Evaluate Positive Wisdom rules (POSITIVE direction)
  let positiveScore = 0;
  let topPositiveCategory: YoutubePositiveCategory | undefined = undefined;
  let detectedTradition: SentinelTradition = "ISLAM";
  let maxPosScore = 0;

  for (const posRule of POSITIVE_WISDOM_RULES) {
    const match = posRule.regex.exec(corpus);
    if (match) {
      positiveScore += posRule.weight;
      matchedRules.push({
        ruleId: posRule.id,
        category: posRule.category,
        pattern: posRule.regex.source,
        weight: posRule.weight,
        label: posRule.label,
        excerpt: match[0],
      });
      if (posRule.weight > maxPosScore) {
        maxPosScore = posRule.weight;
        topPositiveCategory = posRule.category;
        detectedTradition = posRule.tradition;
      }
    }
  }

  // Tradition fallback detector if not set by positive rule
  if (/\b(kristen|gereja|pendeta|alkitab|injil|katolik|romo|pastur|paus)\b/i.test(corpus)) {
    detectedTradition = "KRISTEN";
  } else if (/\b(hindu|pura|pedanda|veda|weda|dharma\s+hindu)\b/i.test(corpus)) {
    detectedTradition = "HINDU";
  } else if (/\b(buddha|vihara|biksu|bhikkhu|tripitaka|dhammapada)\b/i.test(corpus)) {
    detectedTradition = "BUDDHA";
  } else if (/\b(khonghucu|kelenteng|litang|confucius)\b/i.test(corpus)) {
    detectedTradition = "KHONGHUCU";
  }

  // Calculate raw violation sum
  const totalViolationRaw = Object.values(categoryScores).reduce((acc, val) => acc + (val ?? 0), 0);

  // DECISION MATRIX FOR DIRECTION:
  // Case A: Pure positive content (positive wisdom matches present, zero or trivial negative markers)
  if (topPositiveCategory && totalViolationRaw === 0 && transactionalBoost === 0) {
    return {
      direction: "POSITIVE",
      tradition: detectedTradition,
      category: topPositiveCategory,
      riskLevel: "DAKWAH_REFUTATION",
      riskScore: 0,
      isRefutation: false,
      matchedRules,
      positiveCategory: topPositiveCategory,
    };
  }

  // Case B: Explicit refutation / debunking of negative content
  const isRefutation = refutationScore >= 30 && refutationScore >= totalViolationRaw * 0.4;
  if (isRefutation) {
    return {
      direction: "POSITIVE",
      tradition: detectedTradition,
      category: topPositiveCategory ?? "TAUHID_DAKWAH",
      riskLevel: "DAKWAH_REFUTATION",
      riskScore: 5,
      isRefutation: true,
      matchedRules,
      positiveCategory: topPositiveCategory ?? "TAUHID_DAKWAH",
    };
  }

  // Case C: Clear / Neutral (no matches anywhere)
  if (matchedRules.length === 0) {
    return {
      direction: "NEUTRAL",
      tradition: detectedTradition,
      category: "BEBAS_SYIRIK",
      riskLevel: "NOMINAL_CLEAR",
      riskScore: 0,
      isRefutation: false,
      matchedRules: [],
    };
  }

  // Case D: Negative content detected (Syirik, Dukun, Khodam, Pesugihan, dsb)
  let primaryCategory: YoutubeViolationCategory = "UMUM_SYIRIK";
  let maxCatScore = 0;
  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score && score > maxCatScore) {
      maxCatScore = score;
      primaryCategory = cat as YoutubeViolationCategory;
    }
  }

  const calculatedScore = Math.min(100, Math.max(10, maxCatScore + transactionalBoost));

  let riskLevel: YoutubeRiskLevel = "ADVISORY_SUPERSTITION";
  if (calculatedScore >= 70 || primaryCategory === "SIHIR_PELET" || primaryCategory === "PESUGIHAN_TUMBAL") {
    riskLevel = "CRITICAL_SYIRIK";
  } else if (calculatedScore >= 40) {
    riskLevel = "HIGH_SYIRIK_RISK";
  }

  return {
    direction: "NEGATIVE",
    tradition: detectedTradition,
    category: primaryCategory,
    riskLevel,
    riskScore: calculatedScore,
    isRefutation: false,
    matchedRules,
  };
}

/**
 * Creates a fully resolved YoutubeMonitoredItem from basic metadata
 */
export function buildMonitoredItem(raw: {
  videoId: string;
  title: string;
  channelTitle: string;
  channelUrl?: string;
  publishedAt?: string;
  viewCountText?: string;
  durationText?: string;
  thumbnailUrl?: string;
  description?: string;
  transcript?: string;
  sourceType?: YoutubeMonitoredItem["sourceType"];
}): YoutubeMonitoredItem {
  const analysis = evaluateVideoText({
    title: raw.title,
    description: raw.description,
    channelTitle: raw.channelTitle,
    transcript: raw.transcript,
  });

  const guidance: TauhidGuidance = TAUHID_DALIL_MATRIX[analysis.category] ?? TAUHID_DALIL_MATRIX.UMUM_SYIRIK ?? {
    topic: "Penjagaan Tauhid & Akidah",
    dalilRef: "QS. Luqman: 13",
    arabicText: "إِنَّ الشِّرْكَ لَظُلْمٌ عَظِيمٌ",
    translation: "Sesungguhnya menyekutukan (ALLAH) adalah benar-benar kezaliman yang besar.",
    theologicalPrinciple: "Tauhid adalah pondasi seluruh amal perbuatan.",
    recommendedAction: "Tingkatkan literasi Tauhid dan kuatkan benteng akidah keluarga.",
  };

  // Build ready-to-file YouTube report packet
  const reportCategory = analysis.category === "PESUGIHAN_TUMBAL" || analysis.riskScore >= 70
    ? "scams_fraud"
    : "harmful_dangerous";

  const reportPacket: YoutubeReportPacket = {
    platform: "YouTube",
    targetUrl: `https://www.youtube.com/watch?v=${raw.videoId}`,
    videoTitle: raw.title,
    channelTitle: raw.channelTitle,
    reportedCategory: reportCategory,
    policyReference: "YouTube Community Guidelines — Harmful or dangerous acts / Deceptive practices & Scams",
    generatedComplaint:
      `Video "${raw.title}" oleh ${raw.channelTitle} mempromosikan praktik okultisme/penipuan mistis berbayar (${analysis.category}). ` +
      `Konten ini berpotensi membahayakan publik melalui transaksi janji palsu (uang gaib/jimat/santet) yang melanggar hukum dan norma kemanusiaan. ` +
      `Trigger teridentifikasi: ${analysis.matchedRules.map((r) => r.label).join(", ")}.`,
    recommendedTimestamp: "00:01",
  };

  const counterDakwahBrief: CounterDakwahBrief = {
    summary: `Bantahan ilmiah Tauhid untuk tayangan bertema ${guidance.topic}.`,
    dalilReferences: [guidance.dalilRef],
    keyRebuttalPoints: [
      guidance.theologicalPrinciple,
      "Semua manfaat dan perlindungan hanya bersumber dari ALLAH Ta'ala.",
      "Praktik klaim kesaktian dan peramalan nasib secara syar'i adalah kedustaan besar.",
    ],
    suggestedCommentResponse:
      `Ingatlah firman ALLAH: "${guidance.translation}" (${guidance.dalilRef}). ` +
      `Jangan biarkan akidah kita goyah demi janji palsu perdukunan dan pesugihan. Kembalilah kepada Tauhid yang lurus.`,
  };

  // Build Wisdom and Amplify packets for POSITIVE content
  const posCategory = (analysis.positiveCategory ?? "TAUHID_DAKWAH") as YoutubePositiveCategory;
  const wisdomGuidance = WISDOM_GUIDANCE_MATRIX[posCategory] ?? WISDOM_GUIDANCE_MATRIX.TAUHID_DAKWAH;

  const amplifyPacket: YoutubeAmplifyPacket = {
    platform: "YouTube",
    targetUrl: `https://www.youtube.com/watch?v=${raw.videoId}`,
    videoTitle: raw.title,
    channelTitle: raw.channelTitle,
    tradition: analysis.tradition,
    wisdomCategory: posCategory,
    generatedEndorsement: `Rekomendasi tayangan inspiratif & berfaedah: "${raw.title}" oleh ${raw.channelTitle}. Mengandung nilai ${wisdomGuidance.coreValue}.`,
    suggestedHashtags: ["#DakwahKebajikan", "#KajianMoral", "#EmpireOfTheLight", "#HikmahLuhur", `#Tradisi${analysis.tradition}`],
    suggestedShareCaption: `Mari luangkan waktu menyimak konten bermanfaat ini: "${raw.title}". Rujukan: ${wisdomGuidance.scriptureRef} — "${wisdomGuidance.translation}".`,
  };

  const wisdomBrief: WisdomBrief = {
    summary: `Kurasi konten kebajikan bertema: ${wisdomGuidance.topic}.`,
    coreValues: [wisdomGuidance.coreValue],
    keyInsights: [
      wisdomGuidance.translation,
      wisdomGuidance.recommendedAction,
      `Tradisi: ${analysis.tradition}`,
    ],
    suggestedShareComment: `MasyaAllah/Praise be, tayangan yang menyejukkan hati dan menguatkan budi pekerti. Rujukan: ${wisdomGuidance.scriptureRef}.`,
  };

  // Automated matches are candidates for a human, never an automatic conviction.
  const defaultWorkflowStatus: YoutubeWorkflowStatus = analysis.direction === "POSITIVE"
    ? "AMPLIFY_RECOMMENDED"
    : "PENDING_REVIEW";

  return {
    id: `yt-${raw.videoId}`,
    videoId: raw.videoId,
    url: `https://www.youtube.com/watch?v=${raw.videoId}`,
    title: raw.title,
    channelTitle: raw.channelTitle,
    channelUrl: raw.channelUrl ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(raw.channelTitle)}`,
    publishedAt: raw.publishedAt ?? new Date().toISOString(),
    viewCountText: raw.viewCountText ?? "N/A",
    durationText: raw.durationText,
    thumbnailUrl: raw.thumbnailUrl ?? `https://i.ytimg.com/vi/${raw.videoId}/hqdefault.jpg`,
    descriptionSnippet: raw.description ?? raw.title,
    direction: analysis.direction,
    tradition: analysis.tradition,
    riskLevel: analysis.riskLevel,
    category: analysis.category,
    riskScore: analysis.riskScore,
    isRefutation: analysis.isRefutation,
    matchedRules: analysis.matchedRules,
    tauhidGuidance: guidance,
    wisdomGuidance,
    reportPacket,
    amplifyPacket,
    counterDakwahBrief,
    wisdomBrief,
    workflowStatus: defaultWorkflowStatus,
    scannedAt: new Date().toISOString(),
    sourceType: raw.sourceType ?? "demo_synthetic",
    transcriptAnalyzed: Boolean(raw.transcript && raw.transcript.length > 0),
    transcriptSnippet: raw.transcript ? raw.transcript.slice(0, 300) : undefined,
  };
}

// Fictional examples are only available when an operator explicitly enables demo mode.
const SEED_YOUTUBE_RECORDS = [
  {
    videoId: "pesugihan_01",
    title: "PESUGIHAN UANG GAIB NYATA TANPA TUMBAL RESMI KI ANOM - MAHAR SEIKHLASNYA HUBUNGI WA",
    channelTitle: "Padepokan Gaib Nusantara",
    viewCountText: "184K views",
    durationText: "14:22",
    description: "Tarik dana hibah bank gaib langsung cair hari ini tanpa tumbal nyawa. Hubungi WA 08123456789 ki prana sakti terbukti manjur.",
  },
  {
    videoId: "khodam_02",
    title: "LIVE CEK KHODAM ONLINE GRATIS DAN PENGISIAN KHODAM MACAN PUTIH PENDAMPING SAKTI",
    channelTitle: "Spiritual Cahaya Indigo",
    viewCountText: "520K views",
    durationText: "1:02:15",
    description: "Cek khodam leluhur dan pengisian jin pendamping pelindung diri. Tulis nama di live chat langsung diterawang.",
  },
  {
    videoId: "santet_03",
    title: "SANTET JARAK JAUH BANYUWANGI AMPUH BIKIN TARGET TUNDUK DALAM 1 HARI - MAHAR TINGKAT TINGGI",
    channelTitle: "Pusaka Mistik Hitam",
    viewCountText: "98K views",
    durationText: "08:45",
    description: "Layanan santet dan teluh jarak jauh antar pulau dijamin berhasil 100% garansi uang kembali. Hubungi kontak spiritual.",
  },
  {
    videoId: "jimat_04",
    title: "TES KEBAL BACOK KERIS PUSAKA NAGA SASRA DAN WAFAK SABUK RAJAH KEBAL GAIB",
    channelTitle: "Kolektor Benda Bertuah",
    viewCountText: "310K views",
    durationText: "11:10",
    description: "Uji kekebalan senjata tajam menggunakan jimat kebal bacok dan batu mustika merah delima asli tarikan alam gaib.",
  },
  {
    videoId: "tarot_05",
    title: "BACA KARTU TAROT NASIB DAN JODOH ANDA TAHUN 2026 - TERAWANG MASA DEPAN ZODIAK AKURAT",
    channelTitle: "Madame Tarot Indigo",
    viewCountText: "245K views",
    durationText: "26:30",
    description: "Pilih kartu tarot Anda dan simak ramalan nasib karir jodoh dan rezeki masa depan secara akurat menurut tarot.",
  },
  {
    videoId: "sesajen_06",
    title: "RITUAL LARUNG SESAJI PANTAI SELATAN MINTA PESUGIHAN RATU KIDUL CEPAT KAYA",
    channelTitle: "Jejak Mistis Pantai",
    viewCountText: "412K views",
    durationText: "18:05",
    description: "Persembahan kepala kerbau dan larung sesaji kepada penguasa pantai selatan untuk meminta berkah kekayaan melimpah.",
  },
  {
    videoId: "pelet_07",
    title: "AJIAN PELET JARAN GOYANG DAN SEMAR MESEM TINGKAT TINGGI BISA JARAK JAUH",
    channelTitle: "Griya Pengasihan Nusantara",
    viewCountText: "155K views",
    durationText: "09:50",
    description: "Pelet pemikat lawan jenis sekali pandang langsung jatuh cinta. Pasang susuk emas pemikat aura.",
  },
  {
    videoId: "dakwah_01",
    title: "BAHAYA SYIRIK DAN MEMBONGKAR TRIK PENIPUAN DUKUN BERKEDOK USTADZ - KAJIAN SUNNAH",
    channelTitle: "Kajian Tauhid Salafy",
    viewCountText: "680K views",
    durationText: "45:12",
    description: "Ustadz menjelaskan bahaya dosa syirik akbar dan membongkar modus penipuan dukun berkedok pesugihan dan cek khodam online.",
  },
  {
    videoId: "dakwah_02",
    title: "RUQYAH SYAR'IYYAH LENGKAP PENGHANCUR SIHIR, GANGGUAN JIN, DAN PELET - AYAT PENAWAR AL-QURAN",
    channelTitle: "Ruqyah Syar'iyyah Channel",
    viewCountText: "1.2M views",
    durationText: "1:15:00",
    description: "Bacaan ruqyah syar'iyyah mandiri untuk menangkal dan membersihkan gangguan jin dan pengaruh sihir santet menurut sunnah Nabi.",
  },
  {
    videoId: "dakwah_03",
    title: "MEMBONGKAR RAHASIA TRIK SANTET & BENDA PUSAKA PALSU OLEH MANTAN PRAKTISI",
    channelTitle: "Edukasi Logika & Akidah",
    viewCountText: "890K views",
    durationText: "32:40",
    description: "Eksperimen membongkar trik sulap dukun palsu yang mengaku kebal dan bisa menarik emas atau mustika dari alam gaib.",
  },
  {
    videoId: "makam_08",
    title: "NGALAP BERKAH PETILASAN KERAMAT GUNUNG KAWI MINTA NOMOR DAN REZEKI LANCAR",
    channelTitle: "Wisata Malam Klenik",
    viewCountText: "77K views",
    durationText: "16:15",
    description: "Suasana malam jumat kliwon di makam keramat banyak peziarah ritual meminta nomor dan wangsit pesugihan.",
  },
  {
    videoId: "khodam_09",
    title: "CARA MEMANGGIL KHODAM PENDAMPING LELUHUR AGAR TUNDUK DAN PATUH TANPA PUASA",
    channelTitle: "Kunci Alam Gaib",
    viewCountText: "130K views",
    durationText: "12:00",
    description: "Mantra khusus memanggil jin khodam pendamping untuk menjaga rumah dan penarik rezeki otomatis.",
  },
  // ── Konten Positif / Kebajikan Lintas Tradisi (Direction = POSITIVE) ──
  {
    videoId: "hikmah_islam_01",
    title: "KAJIAN TAUHID: MENGENAL ALLAH DAN MEMURNIKAN IBADAH HANYA KEPADA-NYA",
    channelTitle: "Cahaya Sunnah & Hikmah",
    viewCountText: "420K views",
    durationText: "38:40",
    description: "Penjelasan mendalam makna kalimat Laa Ilaha Illallah, pentingnya mentauhidkan Allah, dan menjauhi segala bentuk kemusyrikan demi keselamatan dunia akhirat.",
  },
  {
    videoId: "hikmah_islam_02",
    title: "AKHLAK MULIA DAN ADAB SEORANG MUSLIM: PENTINGNYA BIRRUL WALIDAIN DAN MENJAGA LISAN",
    channelTitle: "Mimbar Budi Pekerti",
    viewCountText: "310K views",
    durationText: "29:15",
    description: "Kajian budi pekerti Islam tentang keutamaan berbakti pada orang tua, adab penuntut ilmu, serta keikhlasan dalam beramal sehari-hari.",
  },
  {
    videoId: "hikmah_kristen_01",
    title: "KHOTBAH KRISTEN: HUKUM KASIH AGAPE, PENGAMPUNAN, DAN PENGHARAPAN DI DALAM TUHAN",
    channelTitle: "Kabar Baik & Pengharapan",
    viewCountText: "280K views",
    durationText: "35:20",
    description: "Renungan firman mengenai hukum kasih, buah roh kesabaran, serta kekuatan pengampunan dan kasih sesama manusia tanpa membeda-bedakan.",
  },
  {
    videoId: "hikmah_hindu_01",
    title: "DHARMA WACANA: TRI KAYA PARISUDHA DAN MAKNA KARMA PHALA DALAM KEHIDUPAN NYATA",
    channelTitle: "Suara Dharma Nusantara",
    viewCountText: "95K views",
    durationText: "24:10",
    description: "Pemahaman ajaran Dharma tentang tiga perbuatan suci: pikiran yang baik, perkataan yang jujur, dan perbuatan yang bajik bagi keharmonisan semesta.",
  },
  {
    videoId: "hikmah_buddha_01",
    title: "DHAMMADESANA: JALAN MULIA BERUNSUR DELAPAN DAN KEDAMAIAN CINTA KASIH UNIVERSAL METTA",
    channelTitle: "Pustaka Kebijaksanaan",
    viewCountText: "115K views",
    durationText: "41:00",
    description: "Uraian bait-bait Dhammapada tentang mengendalikan pikiran dari amarah, melatih ketenangan batin, serta menebarkan cinta kasih universal kepada semua makhluk.",
  },
  {
    videoId: "hikmah_khonghucu_01",
    title: "BUDI PEKERTI KHONGHUCU: KELUHURAN NILAI REN DAN LI DALAM KELUARGA DAN MASYARAKAT",
    channelTitle: "Harmoni Kebajikan",
    viewCountText: "62K views",
    durationText: "22:50",
    description: "Pelajaran moral luhur ajaran Khonghucu tentang kemanusiaan (Ren), kesusilaan (Li), dan prinsip tenggang rasa saling menghormati.",
  },
];

// In-Memory Repository
class YoutubeSentinelRepository {
  private items: Map<string, YoutubeMonitoredItem> = new Map();
  private brandNewIds: Set<string> = new Set();
  private lastScanTimestamp: string = new Date().toISOString();

  constructor() {
    this.seed();
  }

  private seed() {
    if (typeof process === "undefined" || process.env?.YOUTUBE_SENTINEL_DEMO_MODE !== "true") return;
    for (const record of SEED_YOUTUBE_RECORDS) {
      const item = buildMonitoredItem({
        ...record,
        sourceType: "demo_synthetic",
      });
      this.items.set(item.id, item);
    }
  }

  public getItems(filters?: {
    direction?: SentinelDirection;
    tradition?: SentinelTradition;
    category?: string;
    riskLevel?: string;
    workflowStatus?: string;
    search?: string;
    hideResolved?: boolean;
    onlyNew?: boolean;
  }): YoutubeMonitoredItem[] {
    let result = Array.from(this.items.values());

    if (filters?.direction && (filters.direction as string) !== "ALL") {
      result = result.filter((item) => item.direction === filters.direction);
    }

    if (filters?.tradition && (filters.tradition as string) !== "ALL") {
      result = result.filter((item) => item.tradition === filters.tradition);
    }

    if (filters?.hideResolved) {
      result = result.filter(
        (item) => item.workflowStatus !== "REPORT_FILED" && item.workflowStatus !== "FALSE_POSITIVE_DISMISSED",
      );
    }

    if (filters?.onlyNew) {
      result = result.filter((item) => Boolean(item.isNew));
    }

    if (filters?.category && filters.category !== "ALL") {
      result = result.filter((item) => item.category === filters.category);
    }

    if (filters?.riskLevel && filters.riskLevel !== "ALL") {
      result = result.filter((item) => item.riskLevel === filters.riskLevel);
    }

    if (filters?.workflowStatus && filters.workflowStatus !== "ALL") {
      result = result.filter((item) => item.workflowStatus === filters.workflowStatus);
    }

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.channelTitle.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term) ||
          item.riskLevel.toLowerCase().includes(term) ||
          item.descriptionSnippet.toLowerCase().includes(term) ||
          (item.tradition && item.tradition.toLowerCase().includes(term)),
      );
    }

    // Sort by riskScore descending, then date
    return result.sort((a, b) => b.riskScore - a.riskScore);
  }

  public getItemById(id: string): YoutubeMonitoredItem | undefined {
    return this.items.get(id);
  }

  public hasItem(id: string): boolean {
    return this.items.has(id);
  }

  public isBrandNew(id: string): boolean {
    return this.brandNewIds.has(id);
  }

  /**
   * Upsert item.
   * If item already exists: preserves operator review workflow and notes.
   * Returns true if brand new, false if existing item updated.
   */
  public upsertItem(item: YoutubeMonitoredItem): boolean {
    const existing = this.items.get(item.id);
    if (existing) {
      item.workflowStatus = existing.workflowStatus;
      item.operatorNotes = existing.operatorNotes;
      item.lastActionAt = existing.lastActionAt;
      item.isNew = false;
      this.items.set(item.id, item);
      return false;
    }
    item.isNew = true;
    this.brandNewIds.add(item.id);
    this.items.set(item.id, item);
    return true;
  }

  public updateWorkflowStatus(
    id: string,
    status: YoutubeWorkflowStatus,
    operatorNotes?: string,
  ): YoutubeMonitoredItem | null {
    const item = this.items.get(id);
    if (!item) return null;

    item.workflowStatus = status;
    if (operatorNotes !== undefined) {
      item.operatorNotes = operatorNotes;
    }
    item.lastActionAt = new Date().toISOString();
    this.items.set(id, item);
    return item;
  }

  public getSummary(): YoutubeScanSummary {
    const all = Array.from(this.items.values());
    const positiveItems = all.filter((i) => i.direction === "POSITIVE");
    const traditions = Array.from(new Set(all.map((i) => i.tradition).filter(Boolean)));
    return {
      totalMonitored: all.length,
      criticalSyirikCount: all.filter((i) => i.riskLevel === "CRITICAL_SYIRIK").length,
      highRiskCount: all.filter((i) => i.riskLevel === "HIGH_SYIRIK_RISK").length,
      advisoryCount: all.filter((i) => i.riskLevel === "ADVISORY_SUPERSTITION").length,
      counterDakwahCount: all.filter((i) => i.riskLevel === "DAKWAH_REFUTATION").length,
      safeCount: all.filter((i) => i.riskLevel === "NOMINAL_CLEAR").length,
      pendingReviewCount: all.filter((i) => i.workflowStatus === "PENDING_REVIEW").length,
      actionTakenCount: all.filter((i) => i.workflowStatus === "REPORT_FILED" || i.workflowStatus === "COUNTER_DAKWAH_QUEUED" || i.workflowStatus === "AMPLIFY_RECOMMENDED" || i.workflowStatus === "SHARED_VIA_DAKWAH").length,
      lastScanTimestamp: this.lastScanTimestamp,
      activeSensors: ["dna-basir", "dna-hafiz", "dna-khabir", "dna-haqq", "dna-ahad"],
      positiveContentCount: positiveItems.length,
      detectedTraditions: traditions,
    };
  }

  public setLastScanTimestamp(iso: string) {
    this.lastScanTimestamp = iso;
  }
}

export const youtubeSentinelRepo = new YoutubeSentinelRepository();

/**
 * Cross-platform detection of Chrome or Chromium browser executable
 */
export function findBrowserExecutable(): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;

  const candidates: Array<string | undefined> = [
    // Windows Google Chrome
    process.env["PROGRAMFILES"] ? `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    process.env["PROGRAMFILES(X86)"] ? `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    process.env["LOCALAPPDATA"] ? `${process.env["LOCALAPPDATA"]}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    // Windows Microsoft Edge (Chromium based)
    process.env["PROGRAMFILES(X86)"] ? `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined,
    process.env["PROGRAMFILES"] ? `${process.env["PROGRAMFILES"]}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined,
    // Linux Chromium / Chrome
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];

  for (const path of candidates) {
    if (path) {
      try {
        if (existsSync(path)) return path;
      } catch {
        // Continue searching
      }
    }
  }
  return undefined;
}

export interface CrawledVideoData {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  viewCountText?: string;
  durationText?: string;
  publishedText?: string;
  transcript?: string;
}

/**
 * Singleton cached Innertube client instance (LuanRT/YouTube.js)
 */
let cachedInnertube: any = null;

export async function getInnertubeClient(): Promise<any> {
  if (!cachedInnertube) {
    const { Innertube } = await import("youtubei.js");
    cachedInnertube = await Innertube.create({
      retrieve_player: false,
    });
  }
  return cachedInnertube;
}

/**
 * High-speed native YouTube InnerTube search crawler via LuanRT/YouTube.js.
 * Ultra-fast (<1-2s), returns authentic metadata, requires no browser launch overhead.
 */
export async function crawlYoutubeWithInnertube(
  query: string,
  limit: number = 15,
  sortBy: YoutubeSortBy = "upload_date",
): Promise<CrawledVideoData[]> {
  const yt = await getInnertubeClient();
  const search = await yt.search(query, {
    type: "video",
    ...(sortBy === "upload_date" ? { sort_by: "upload_date" } : {}),
  });
  const videos = (search.videos ?? []) as any[];

  const results: CrawledVideoData[] = [];
  for (const v of videos) {
    const id = String(v.id ?? "");
    const title = String(v.title?.text ?? v.title?.toString() ?? "");
    const channel = String(v.author?.name ?? v.author?.toString() ?? "YouTube Creator");
    const views = String(v.view_count?.text ?? v.view_count?.toString() ?? "");
    const duration = String(v.duration?.text ?? v.duration?.toString() ?? "");
    const desc = String(v.description_snippet?.text ?? v.description?.toString() ?? "");
    const published = String(v.published?.text ?? v.published_time?.text ?? "");

    if (id && title) {
      results.push({
        videoId: id,
        title,
        channelTitle: channel,
        description: desc,
        viewCountText: views,
        durationText: duration,
        publishedText: published,
      });
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Automates a real browser session (via Playwright / Chromium headless)
 * to navigate to YouTube, extract actual search results, and return structured metadata.
 */
export async function crawlYoutubeWithPlaywright(
  query: string,
  limit: number = 10,
  sortBy: YoutubeSortBy = "upload_date",
): Promise<CrawledVideoData[]> {
  const { chromium } = await import("playwright-core");
  const executablePath = findBrowserExecutable();

  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1280,800",
  ];

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: launchArgs,
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      locale: "id-ID",
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    const sortParam = sortBy === "upload_date" ? "&sp=CAI%253D" : "";
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sortParam}`;

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Allow dynamic YouTube client renderers to populate
    await page.waitForTimeout(2000);

    const items = await page.evaluate((maxCount: number) => {
      const results: CrawledVideoData[] = [];
      const elements = Array.from(document.querySelectorAll("ytd-video-renderer"));

      for (const el of elements) {
        const titleAnchor = el.querySelector("#video-title") as HTMLAnchorElement | null;
        const channelEl = el.querySelector("#channel-info ytd-channel-name a, #byline a") as HTMLElement | null;
        const snippetEl = el.querySelector(".metadata-snippet-container, #description-text") as HTMLElement | null;
        const metaSpans = el.querySelectorAll("#metadata-line span.inline-metadata-item");
        const views = metaSpans[0]?.textContent?.trim() || "";
        const published = metaSpans[1]?.textContent?.trim() || "";
        const durationBadge = el.querySelector("ytd-thumbnail-overlay-time-status-renderer badge-shape, ytd-thumbnail-overlay-time-status-renderer span") as HTMLElement | null;
        const duration = durationBadge?.textContent?.trim() || "";

        const href = titleAnchor?.getAttribute("href") || "";
        const match = href.match(/v=([a-zA-Z0-9_-]+)/);
        const videoId = match ? match[1] : "";
        const titleText = titleAnchor?.textContent?.trim() || "";

        if (videoId && titleText) {
          results.push({
            videoId,
            title: titleText,
            channelTitle: channelEl?.textContent?.trim() || "YouTube Creator",
            description: snippetEl?.textContent?.trim() || "",
            viewCountText: views,
            durationText: duration,
            publishedText: published,
          });
          if (results.length >= maxCount) break;
        }
      }
      return results;
    }, limit);

    return items;
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Executes a live YouTube search/crawler scan.
 * Supports dual engines:
 * 1. "innertube" (LuanRT/YouTube.js) - Ultra-fast, direct protocol extraction (recommended)
 * 2. "playwright" - Full headless Chromium browser automation
 * Automatically falls back gracefully if network restricts any specific mode.
 */
export async function scanYoutube(
  params: YoutubeScanQuery,
  adapters: { crawlInnertube: typeof crawlYoutubeWithInnertube; crawlPlaywright: typeof crawlYoutubeWithPlaywright } = {
    crawlInnertube: crawlYoutubeWithInnertube,
    crawlPlaywright: crawlYoutubeWithPlaywright,
  },
): Promise<YoutubeScanResult> {
  const query = params.query.trim();
  const limit = params.limit ?? 12;
  const sortBy: YoutubeSortBy = params.sortBy ?? "upload_date";
  const scannedBatch: YoutubeMonitoredItem[] = [];
  let brandNewCount = 0;
  let existingCount = 0;
  let crawlerMode: YoutubeScanResult["crawlerMode"] = "no_results";
  let diagnosticMessage = "";

  const engine = params.engine ?? (params.useBrowserAutomation ? "playwright" : "auto");

  // Mode A: High-speed InnerTube (YouTube.js) — tested when engine is "innertube" or "auto"
  if (engine === "innertube" || engine === "auto") {
    try {
      const crawled = await adapters.crawlInnertube(query, limit, sortBy);
      if (crawled.length > 0) {
        crawlerMode = "youtubei_innertube";
        for (const data of crawled) {
          const item = buildMonitoredItem({
            videoId: data.videoId,
            title: data.title,
            channelTitle: data.channelTitle,
            description: data.description,
            viewCountText: data.viewCountText,
            durationText: data.durationText,
            publishedAt: data.publishedText,
            transcript: data.transcript,
            sourceType: "innertube_client",
          });
          const isBrandNew = youtubeSentinelRepo.upsertItem(item);
          if (isBrandNew) brandNewCount++;
          else existingCount++;
          scannedBatch.push(item);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      diagnosticMessage = `YouTube.js InnerTube notice: ${errMsg}`;
    }
  }

  // Mode B: Playwright Headless Browser — when engine is "playwright" or as fallback for "auto"
  if (scannedBatch.length === 0 && (engine === "playwright" || engine === "auto" || params.useBrowserAutomation)) {
    try {
      const crawled = await adapters.crawlPlaywright(query, limit, sortBy);
      if (crawled.length > 0) {
        crawlerMode = "playwright_headless_browser";
        for (const data of crawled) {
          const item = buildMonitoredItem({
            videoId: data.videoId,
            title: data.title,
            channelTitle: data.channelTitle,
            description: data.description,
            viewCountText: data.viewCountText,
            durationText: data.durationText,
            publishedAt: data.publishedText,
            sourceType: "browser_automation",
          });
          const isBrandNew = youtubeSentinelRepo.upsertItem(item);
          if (isBrandNew) brandNewCount++;
          else existingCount++;
          scannedBatch.push(item);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      diagnosticMessage = (diagnosticMessage ? `${diagnosticMessage}; ` : "") + `Playwright crawl notice: ${errMsg}`;
    }
  }

  // 2. Secondary fallback: HTTP fetch with ytInitialData parsing if requested and online
  if (scannedBatch.length === 0 && (params.forceLive ?? false)) {
    try {
      const sortParam = sortBy === "upload_date" ? "&sp=CAI%253D" : "";
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sortParam}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const html = await res.text();
        const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
        if (jsonMatch?.[1]) {
          const ytData = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
          const extracted = parseYtInitialData(ytData, limit);
          if (extracted.length > 0) {
            crawlerMode = "http_live_fetch";
            for (const itemData of extracted) {
              const item = buildMonitoredItem({ ...itemData, sourceType: "live_search" });
              const isBrandNew = youtubeSentinelRepo.upsertItem(item);
              if (isBrandNew) brandNewCount++;
              else existingCount++;
              scannedBatch.push(item);
            }
          }
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  // A scan without crawler results is empty, never invented evidence.
  if (scannedBatch.length === 0) {
    crawlerMode = "no_results";
    diagnosticMessage = [diagnosticMessage, "Tidak ada hasil YouTube yang berhasil diambil; tidak ada temuan sintetis yang dibuat."]
      .filter(Boolean)
      .join("; ");
  }

  youtubeSentinelRepo.setLastScanTimestamp(new Date().toISOString());

  return {
    scannedCount: scannedBatch.length,
    newItemsCount: brandNewCount,
    existingItemsCount: existingCount,
    items: params.onlyNew ? scannedBatch.filter((i) => i.isNew) : youtubeSentinelRepo.getItems(),
    summary: youtubeSentinelRepo.getSummary(),
    crawlerMode,
    diagnosticMessage: diagnosticMessage || undefined,
  };
}

/**
 * Extracts video items from YouTube's initial JSON payload safely
 */
function parseYtInitialData(
  data: Record<string, unknown>,
  limit: number,
): Array<{ videoId: string; title: string; channelTitle: string; description: string }> {
  const results: Array<{ videoId: string; title: string; channelTitle: string; description: string }> = [];
  try {
    const contents = (data as any)?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents;
    if (!Array.isArray(contents)) return results;

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (Array.isArray(items)) {
        for (const item of items) {
          const video = item?.videoRenderer;
          if (video?.videoId && video?.title?.runs?.[0]?.text) {
            results.push({
              videoId: String(video.videoId),
              title: String(video.title.runs[0].text),
              channelTitle: String(video.ownerText?.runs?.[0]?.text ?? "YouTube Creator"),
              description: String(video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.[0]?.text ?? ""),
            });
            if (results.length >= limit) return results;
          }
        }
      }
    }
  } catch {
    // Return whatever was parsed
  }
  return results;
}


