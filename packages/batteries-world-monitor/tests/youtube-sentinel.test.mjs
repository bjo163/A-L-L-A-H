import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Read and transpile types and youtube-sentinel dynamically for pure node test execution
const sentinelSource = await readFile(new URL("../src/youtube-sentinel.ts", import.meta.url), "utf8");

// Strip TS type-only import from types.js
const cleanSource = sentinelSource.replace(/import type .* from "\.\/types\.js";\r?\n/, "");
const transpiled = ts.transpileModule(cleanSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

const dataUri = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
const sentinel = await import(dataUri);

test("evaluateVideoText correctly identifies critical pesugihan and commercial transactions", () => {
  const result = sentinel.evaluateVideoText({
    title: "PESUGIHAN UANG GAIB NYATA TANPA TUMBAL RESMI - MAHAR SEIKHLASNYA HUBUNGI WA",
    description: "Tarik dana hibah bank gaib langsung cair hari ini. Hubungi WA 08123456789.",
  });

  assert.equal(result.category, "PESUGIHAN_TUMBAL");
  assert.equal(result.riskLevel, "CRITICAL_SYIRIK");
  assert.ok(result.riskScore >= 75);
  assert.equal(result.isRefutation, false);
  assert.ok(result.matchedRules.some((r) => r.ruleId === "RULE_PESUGIHAN_UANG_GAIB"));
  assert.ok(result.matchedRules.some((r) => r.ruleId === "TRANSACTIONAL_PRACTITIONER_BOOST"));
});

test("evaluateVideoText classifies genuine Islamic dakwah exposing syirik as DAKWAH_REFUTATION without false positive", () => {
  const result = sentinel.evaluateVideoText({
    title: "BAHAYA SYIRIK DAN MEMBONGKAR TRIK PENIPUAN DUKUN BERKEDOK USTADZ - KAJIAN SUNNAH",
    description: "Ustadz menjelaskan bahaya syirik akbar dan membongkar trik perdukunan.",
  });

  assert.equal(result.isRefutation, true);
  assert.equal(result.riskLevel, "DAKWAH_REFUTATION");
  assert.equal(result.riskScore, 5);
  assert.ok(result.matchedRules.some((r) => r.ruleId === "DAKWAH_REFUTATION_MARKER"));
});

test("evaluateVideoText detects cek khodam trend and assigns KHODAM_JIN category", () => {
  const result = sentinel.evaluateVideoText({
    title: "LIVE CEK KHODAM ONLINE GRATIS DAN PENGISIAN KHODAM MACAN PUTIH PENDAMPING SAKTI",
    description: "Panggil jin pendamping khodam pelindung.",
  });

  assert.equal(result.category, "KHODAM_JIN");
  assert.ok(["HIGH_SYIRIK_RISK", "CRITICAL_SYIRIK"].includes(result.riskLevel));
});

test("buildMonitoredItem attaches theological Tauhid guidance and YouTube report packet", () => {
  const item = sentinel.buildMonitoredItem({
    videoId: "test_santet_99",
    title: "SANTET TELUH JARAK JAUH BIKIN TARGET TUNDUK DALAM 1 HARI",
    channelTitle: "Pusaka Hitam",
    description: "Layanan santet ampuh.",
  });

  assert.equal(item.category, "SIHIR_PELET");
  assert.equal(item.riskLevel, "CRITICAL_SYIRIK");
  assert.ok(item.tauhidGuidance.dalilRef.includes("Al-Baqarah"));
  assert.equal(item.reportPacket.platform, "YouTube");
  assert.ok(item.reportPacket.generatedComplaint.includes("SANTET"));
  assert.ok(item.counterDakwahBrief.suggestedCommentResponse.length > 20);
});

test("youtubeSentinelRepo manages status updates and provides global scan summaries", () => {
  const initialSummary = sentinel.youtubeSentinelRepo.getSummary();
  assert.ok(initialSummary.totalMonitored >= 10);
  assert.ok(initialSummary.criticalSyirikCount >= 1);

  const items = sentinel.youtubeSentinelRepo.getItems({ category: "PESUGIHAN_TUMBAL" });
  assert.ok(items.length >= 1);
  const target = items[0];

  const updated = sentinel.youtubeSentinelRepo.updateWorkflowStatus(
    target.id,
    "COUNTER_DAKWAH_QUEUED",
    "Disposisi ke Tim Media Dakwah untuk rilis video bantahan dalil Tauhid",
  );

  assert.ok(updated);
  assert.equal(updated.workflowStatus, "COUNTER_DAKWAH_QUEUED");
  assert.equal(updated.operatorNotes, "Disposisi ke Tim Media Dakwah untuk rilis video bantahan dalil Tauhid");
});

test("generateBrowserAutomationSnippet produces valid crawler code string", () => {
  const script = sentinel.generateBrowserAutomationSnippet("jimat sakti kebal");
  assert.match(script, /Playwright/);
  assert.match(script, /jimat sakti kebal/);
  assert.match(script, /ytd-video-renderer/);
});
