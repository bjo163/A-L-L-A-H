import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { projectMetricState } from "../src/metric-state.mjs";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("overview metrics retain truthful sources, zero values, and permission states", async () => {
  const overview = await source("../src/OverviewView.tsx");
  const app = await source("../src/App.tsx");
  const researchRoute = await source("../../api/src/routes/research.ts");
  const cabRoute = await source("../../api/src/routes/cab.ts");
  const docs = await source("../../../docs/metrics/SHADOW_OVERVIEW.md");

  assert.match(app, /meta\?\.total/);
  assert.match(app, /typeof research\.meta\?\.total === "number" \? research\.meta\.total : null/);
  assert.doesNotMatch(app, /researchItems\.length/);
  assert.match(researchRoute, /ResearchRunModel\.query\(\)\.where\(\{ tenant_id: tenantId \}\)/);
  assert.match(overview, /projectMetricState\(\{ value: researchRunCount, loading, error, permitted: canReadResearch \}\)/);
  assert.match(overview, /projectMetricState\(\{ value: summary\?\.active, loading, error, permitted: canReadCab \}\)/);
  assert.match(overview, /summary\?\.active/);
  assert.match(overview, /System-wide active CAB items/);
  assert.match(overview, /global summary/);
  assert.match(app, /canReadCab=\{can\(entity, "cab:read"\)\}/);
  assert.doesNotMatch(app, />Poster Forge<|key="poster-forge"/);
  assert.match(overview, /permitted: canReadResearch/);
  assert.match(overview, /permitted: canReadCab/);
  assert.match(overview, /Your operator role does not include permission to read recent activity/);
  assert.match(overview, /error \? "UNAVAILABLE"/);
  assert.match(overview, /error \|\| !summary \? "unavailable"/);
  assert.match(overview, /events=\{loading \|\| error \|\| chronicleUnavailable \|\| !canReadContinuum \? \[\] : events\.slice/);
  assert.match(overview, /chronicleUnavailable \|\| !canReadContinuum/);
  assert.match(overview, /continuumStatusUnavailable/);
  assert.match(overview, /!error&&capabilities\.length/);
  assert.match(cabRoute, /app\.get\("\/continuum\/cab\/summary"/);
  assert.match(cabRoute, /ChangeRequestModel\.query\(\)\.resultSize\(\)/);
  assert.match(cabRoute, /app\.addHook\("preHandler", requireSession\)/);
  assert.doesNotMatch(cabRoute.slice(cabRoute.indexOf('app.get("/continuum/cab/summary"'), cabRoute.indexOf('app.get("/continuum/cab/rfcs"')), /tenant_id|tenantId/);
  assert.match(docs, /system-wide operational change control/);
  assert.match(docs, /has not been confirmed by the API\/maintainer owner/);
  assert.match(docs, /audience telemetry/);
  assert.match(docs, /page length is never treated as a total/);
  assert.match(docs, /independently settled/);
});

test("overview metric projection preserves zero/partial totals and identifies access, loading, and errors", () => {
  assert.deepEqual(projectMetricState({ value: 0 }), { value: 0, state: "available" });
  assert.deepEqual(projectMetricState({ value: 35 }), { value: 35, state: "available" });
  assert.deepEqual(projectMetricState({ value: 2 }), { value: 2, state: "available" });
  assert.deepEqual(projectMetricState({ value: 0, permitted: false }), { value: "Access needed", state: "access-needed" });
  assert.deepEqual(projectMetricState({ value: 35, loading: true }), { value: "…", state: "loading" });
  assert.deepEqual(projectMetricState({ value: 35, error: "network failed" }), { value: "—", state: "unavailable" });
  assert.deepEqual(projectMetricState({ value: null }), { value: "—", state: "unavailable" });
});
