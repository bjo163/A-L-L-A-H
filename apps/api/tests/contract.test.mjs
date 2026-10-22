
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("Empire API routes and dashboard compatibility routes are registered", async()=>{
  const source=await readFile(new URL("../src/server.ts",import.meta.url),"utf8");
  const health=await readFile(new URL("../src/routes/health.ts",import.meta.url),"utf8");
  const compat=await readFile(new URL("../src/routes/empire-compat.ts",import.meta.url),"utf8");
  const auth=await readFile(new URL("../src/routes/auth.ts",import.meta.url),"utf8");
  const startupStages=[
    source.indexOf("runAdabScanner(apiRoot)"),
    source.indexOf("loadModulePlan()"),
    source.indexOf("initApiDatabase()"),
    source.indexOf("syncBaseModule(getDatabase(), modulePlan.enabled)"),
    source.indexOf("await app.ready()"),
  ];
  assert.ok(startupStages.every((position)=>position>=0));
  assert.deepEqual(startupStages,[...startupStages].sort((a,b)=>a-b),"startup preflight, fusion preload, database sync, and route readiness must run in order");
  assert.match(source,/app\.addHook\("onClose", async \(\) => \{\s*await closeDatabase\(\);/);
  assert.match(source,/authRoutes/);
  assert.match(source,/continuumRoutes/);
  assert.match(health,/\/health/);
  assert.match(compat,/\/v1\/readiness/);
  assert.match(compat,/\/v1\/dna\/fusion/);
  assert.match(auth,/\/auth\/login/);
  assert.doesNotMatch(source,/role="god"/);
});
