
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
 assert.match(overview,/activeModules/);
 assert.match(overview,/API health/);
 assert.match(overview,/Research runs/);
 assert.match(overview,/Open CAB items/);
 assert.match(overview,/Continuum API status/);
 assert.match(overview,/API capabilities/);
 assert.match(overview,/Research run totals come from the API/);
 assert.doesNotMatch(overview,/Stories in progress|POSTER FORGE|Publishing Workflow|SIGNAL MAP|shadow-crew-thumbs|pulse="100"/);
 assert.match(monitor,/World Monitor/);
 assert.doesNotMatch(app+overview,/BELIEF-TRUTH ALIGNMENT ANALYSIS|98\.7%|8,142/);
});
