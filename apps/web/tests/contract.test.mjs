
import assert from "node:assert/strict";import {test} from "node:test";import {readFile} from "node:fs/promises";
test("100CENTER renders real API statuses and World Monitor tab, no demo religious scoring",async()=>{
 const s=await readFile(new URL("../src/App.tsx",import.meta.url),"utf8");
 const overview=await readFile(new URL("../src/OverviewView.tsx",import.meta.url),"utf8");
 assert.match(s,/API_PATHS\.health/);assert.match(s,/API_PATHS\.readiness/);
 assert.match(s,/API_PATHS\.modules/);assert.match(overview,/Module Registry/);
 assert.match(s,/WorldMonitorView/);assert.match(s,/world.*monitor/i);
 assert.match(s,/API_PATHS\.worldMonitor/);
 assert.doesNotMatch(s,/BELIEF-TRUTH ALIGNMENT ANALYSIS|98\.7%|8,142/);
});
