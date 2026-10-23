import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Read and transpile types and youtube-sentinel dynamically for pure node test execution
const sentinelSource = await readFile(new URL("../src/youtube-sentinel.ts", import.meta.url), "utf8");

const priorDemoSetting = process.env.YOUTUBE_SENTINEL_DEMO_MODE;
delete process.env.YOUTUBE_SENTINEL_DEMO_MODE;

// Strip TS type-only import from types.js
const cleanSource = sentinelSource.replace(/import type .* from "\.\/types\.js";\r?\n/, "");
const transpiled = ts.transpileModule(cleanSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

const dataUri = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
const sentinel = await import(dataUri);
if (priorDemoSetting !== undefined) process.env.YOUTUBE_SENTINEL_DEMO_MODE = priorDemoSetting;

test("evaluateVideoText correctly identifies critical pesugihan and commercial transactions", () => {
  const result = sentinel.evaluateVideoText({
    title: "PESUGIHAN UANG GAIB NYATA TANPA TUMBAL RESMI - MAHAR SEIKHLASNYA HUBUNGI WA",
    description: "Tarik dana hibah bank gaib langsung cair hari ini. Hubungi WA 08123456789.",
  });

  assert.equal(result.category, "PESUGIHAN_TUMBAL");
  assert.equal(result.riskLevel, "CRITICAL_SYIRIK");
  assert.ok(result.riskScore >= 75);
  assert.equal(result.isRefutation, false);
  assert.equal("confidence" in result, false);
  assert.ok(result.matchedRules.some((r) => r.ruleId === "RULE_PESUGIHAN_UANG_GAIB"));
  assert.ok(result.matchedRules.some((r) => r.ruleId === "TRANSACTIONAL_PRACTITIONER_BOOST"));
});

test("religious tradition alone stays neutral and does not create a platform finding", () => {
  const result = sentinel.evaluateVideoText({
    title: "Ritual klasik di pura Bali",
    description: "Dokumenter budaya tentang tradisi dan sejarah setempat.",
  });

  assert.equal(result.direction, "NEUTRAL");
  assert.equal(result.riskScore, 0);
  assert.equal(result.matchedRules.length, 0);
});

test("heuristic matches always start in human review instead of an automatic conclusion", () => {
  const item = sentinel.buildMonitoredItem({
    videoId: "test_review_required",
    title: "PESUGIHAN UANG GAIB",
    channelTitle: "Example fixture",
    sourceType: "demo_synthetic",
  });

  assert.equal(item.workflowStatus, "PENDING_REVIEW");
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
    sourceType: "demo_synthetic",
  });

  assert.equal(item.category, "SIHIR_PELET");
  assert.equal(item.riskLevel, "CRITICAL_SYIRIK");
  assert.ok(item.tauhidGuidance.dalilRef.includes("Al-Baqarah"));
  assert.equal(item.reportPacket.platform, "YouTube");
  assert.ok(item.reportPacket.generatedComplaint.includes("SANTET"));
  assert.ok(item.counterDakwahBrief.suggestedCommentResponse.length > 20);
});

test("in-memory Sentinel repository starts empty and manages actual records", () => {
  const initialSummary = sentinel.youtubeSentinelRepo.getSummary();
  assert.equal(initialSummary.totalMonitored, 0);

  const target = sentinel.buildMonitoredItem({
    videoId: "test_pesugihan_repository",
    title: "PESUGIHAN UANG GAIB TANPA TUMBAL",
    channelTitle: "Example fixture",
    sourceType: "demo_synthetic",
  });
  sentinel.youtubeSentinelRepo.upsertItem(target);
  assert.equal(sentinel.youtubeSentinelRepo.getSummary().totalMonitored, 1);

  const updated = sentinel.youtubeSentinelRepo.updateWorkflowStatus(
    target.id,
    "COUNTER_DAKWAH_QUEUED",
    "Disposisi ke Tim Media Dakwah untuk rilis video bantahan dalil Tauhid",
  );

  assert.ok(updated);
  assert.equal(updated.workflowStatus, "COUNTER_DAKWAH_QUEUED");
  assert.equal(updated.operatorNotes, "Disposisi ke Tim Media Dakwah untuk rilis video bantahan dalil Tauhid");
});

test("failed crawler results do not create synthetic Sentinel evidence", async () => {
  const priorCount = sentinel.youtubeSentinelRepo.getSummary().totalMonitored;
  const result = await sentinel.scanYoutube(
    { query: "offline test query", engine: "playwright" },
    { crawlInnertube: async () => [], crawlPlaywright: async () => [] },
  );

  assert.equal(result.scannedCount, 0);
  assert.equal(result.newItemsCount, 0);
  assert.equal(result.crawlerMode, "no_results");
  assert.match(result.diagnosticMessage, /tidak ada temuan sintetis/i);
  assert.equal(sentinel.youtubeSentinelRepo.getSummary().totalMonitored, priorCount);
  assert.ok(result.items.every((item) => !item.videoId.startsWith("syn-")));
});

test("fictional sample corpus is opt-in and marked synthetic", async () => {
  const prior = process.env.YOUTUBE_SENTINEL_DEMO_MODE;
  process.env.YOUTUBE_SENTINEL_DEMO_MODE = "true";
  try {
    const demoSentinel = await import(`${dataUri}#demo-mode`);
    const demoItems = demoSentinel.youtubeSentinelRepo.getItems();
    assert.ok(demoItems.length > 0);
    assert.ok(demoItems.every((item) => item.sourceType === "demo_synthetic"));
  } finally {
    if (prior === undefined) delete process.env.YOUTUBE_SENTINEL_DEMO_MODE;
    else process.env.YOUTUBE_SENTINEL_DEMO_MODE = prior;
  }
});

test("public browser automation snippet generator remains retired", async () => {
  const source = await readFile(new URL("../src/youtube-sentinel.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /generateBrowserAutomationSnippet/);
});
