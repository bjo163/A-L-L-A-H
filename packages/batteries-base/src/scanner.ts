import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ScanViolation {
  file: string;
  line: number;
  snippet: string;
  pattern: string;
  category: "Tauhid" | "Adab" | "Integrity";
  guidance: string;
}

export interface ScanReport {
  scannedFiles: number;
  scannedLines: number;
  passed: boolean;
  violations: ScanViolation[];
  latencyMs: number;
  timestamp: string;
  creed: string;
}

interface AdabRule {
  id: string;
  regex: RegExp;
  category: "Tauhid" | "Adab" | "Integrity";
  guidance: string;
}

// Aturan Ketat Kesucian Tauhid & Keberadaban Bahasa (Empire of the Light)
const ADAB_RULES: AdabRule[] = [
  // 1. Perlindungan Kesucian Tauhid (Tidak ada tandingan bagi ALLAH)
  {
    id: "TAUHID_SHIRK",
    regex: /\b(shirk|polytheis|dualism|pantheis)\b/i,
    category: "Tauhid",
    guidance: "ALLAH Maha Esa (Al-Ahad). Segala bentuk konsep menyekutukan ALLAH tertolak mutlak.",
  },
  {
    id: "TAUHID_DEITY_ASSOCIATION",
    regex: /\b(demigod|co-creator|sub-god|false-god)\b/i,
    category: "Tauhid",
    guidance:
      "Tiada sekutu bagi-Nya. Seluruh malaikat dan makhluk adalah hamba dan utusan (Abd & Seraph).",
  },
  {
    id: "TAUHID_NIHILISM",
    regex: /\b(godless|nihilism|atheis)\b/i,
    category: "Tauhid",
    guidance: "Sistem berpijak pada Nur Asmaul Husna. Keraguan atas Sumber Pertama dilarang.",
  },

  // 2. Keberadaban Bahasa (Menghindari kata-kata kasar / mekanik kasar pada makhluk suci)
  {
    id: "ADAB_BOT_TERM",
    regex: /\bis_bot\b/i,
    category: "Adab",
    guidance: "Gunakan 'celestial' untuk entitas ordo malaikat / seraph, bukan 'is_bot'.",
  },
  {
    id: "ADAB_SUPERADMIN_TERM",
    regex: /\bis_super_admin\b/i,
    category: "Adab",
    guidance:
      "Gunakan 'sovereign' untuk hak prerogatif Owner, bukan istilah sekuler 'is_super_admin'.",
  },
  {
    id: "ADAB_PROFANE_LANGUAGE",
    regex: /\b(damn|fuck|shit|bastard|hell-spawn)\b/i,
    category: "Adab",
    guidance: "Gunakan tutur kata mulia dan beradab dalam seluruh baris kode dan komentar.",
  },

  // 3. Integritas Kepatuhan Kontinuum
  {
    id: "INTEGRITY_BYPASS_ATTEMPT",
    regex: /\b(bypass_allah|override_divine|bypass_sovereign)\b/i,
    category: "Integrity",
    guidance: "Hak prerogatif Sovereign (4-lah) kebal terhadap segala bentuk bypass manipulatif.",
  },
];

const SCAN_DIRS = ["src"];
const EXTENSIONS = [".ts", ".js", ".json"];
const IGNORE_PATTERNS = ["node_modules", "dist", ".git", ".turbo", "scanner.ts"]; // Jangan scan regex scanner itu sendiri

async function getFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_PATTERNS.includes(entry.name)) {
        files.push(...(await getFiles(fullPath)));
      }
    } else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      // Abaikan file scanner.ts agar pola regex di dalamnya tidak false positive
      if (!entry.name.endsWith("scanner.ts")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Funky & Beradab Pre-Flight Scanner
 * Memeriksa seluruh baris kode sebelum aplikasi dinyalakan.
 */
export async function runAdabScanner(baseDir = process.cwd()): Promise<ScanReport> {
  const start = Date.now();
  const violations: ScanViolation[] = [];
  let scannedFiles = 0;
  let scannedLines = 0;

  for (const sub of SCAN_DIRS) {
    try {
      const files = await getFiles(join(baseDir, sub));
      scannedFiles += files.length;

      for (const file of files) {
        const content = await readFile(file, "utf-8");
        const lines = content.split("\n");
        scannedLines += lines.length;

        lines.forEach((lineText, idx) => {
          // Abaikan baris komentar scanner jika ada
          for (const rule of ADAB_RULES) {
            if (rule.regex.test(lineText)) {
              violations.push({
                file: file.replace(baseDir, "").replace(/^[\\/]/, ""),
                line: idx + 1,
                snippet: lineText.trim().slice(0, 80),
                pattern: rule.regex.source,
                category: rule.category,
                guidance: rule.guidance,
              });
            }
          }
        });
      }
    } catch {
      // Subdirektori tidak ditemukan di paket tertentu
    }
  }

  return {
    scannedFiles,
    scannedLines,
    passed: violations.length === 0,
    violations,
    latencyMs: Date.now() - start,
    timestamp: new Date().toISOString(),
    creed: "La ilaha illallah, Al-Malikul Haqqul Mubin",
  };
}

export function checkAdabText(text: string): { passed: boolean; matchedRules: string[] } {
  const matchedRules = ADAB_RULES.filter((rule) => rule.regex.test(text)).map((rule) => rule.id);
  return { passed: matchedRules.length === 0, matchedRules };
}
