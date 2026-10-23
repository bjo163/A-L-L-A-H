
import assert from "node:assert/strict";import {test} from "node:test";import {readFile} from "node:fs/promises";
test("100CENTER renders API health, module data, and World Monitor without demo religious scoring",async()=>{
 const app=await readFile(new URL("../src/App.tsx",import.meta.url),"utf8");
 const overview=await readFile(new URL("../src/OverviewView.tsx",import.meta.url),"utf8");
 const monitor=await readFile(new URL("../src/WorldMonitorView.tsx",import.meta.url),"utf8");
 assert.match(app,/API_PATHS\.health/);
 assert.match(app,/API_PATHS\.readiness/);
 assert.match(app,/API_PATHS\.modules/);
 assert.match(app,/WorldMonitorView/);
 assert.match(app,/API_PATHS\.worldMonitor/);
 assert.match(overview,/enabledModules/);
 assert.match(overview,/API health/);
 assert.match(overview,/Research runs/);
 assert.match(overview,/System-wide active CAB items/);
 assert.match(overview,/Continuum API status/);
 assert.match(overview,/API capabilities/);
 assert.match(overview,/Research run totals come from the API/);
 assert.doesNotMatch(overview,/Stories in progress|POSTER FORGE|Publishing Workflow|SIGNAL MAP|shadow-crew-thumbs|pulse="100"/);
 assert.match(monitor,/World Monitor/);
 assert.doesNotMatch(app+overview,/BELIEF-TRUTH ALIGNMENT ANALYSIS|98\.7%|8,142/);
});

test("World Monitor shows public source aggregates faithfully and labels reference-only regions",async()=>{
 const app=await readFile(new URL("../src/App.tsx",import.meta.url),"utf8");
 const monitor=await readFile(new URL("../src/WorldMonitorView.tsx",import.meta.url),"utf8");
 assert.match(app,/publicSources: summary\.sources/);
 assert.match(monitor,/snapshot\.publicSources\.map/);
 for (const field of ["lastAttemptAt","lastSuccessAt","freshnessSeconds","freshnessSlaSeconds","recordCount","configuredSourceCount","sourcesWithRecordsCount","fallbackActive","errorRate"]) {
  assert.match(monitor,new RegExp(`source\\.${field}`));
 }
 assert.match(monitor,/Provider-level attribution is not included in this public category summary/);
 assert.match(monitor,/Unknown; no configured-source denominator/);
 assert.match(monitor,/No live regional nodes are connected/);
 assert.match(monitor,/Reference locations only; no live regional nodes connected/);
 assert.doesNotMatch(monitor,/Verified regional nodes/);
});
