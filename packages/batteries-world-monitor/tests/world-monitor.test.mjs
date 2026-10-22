import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

test("batteries-world-monitor package structure and types are valid", () => {
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.equal(pkg.name, "@empire/batteries-world-monitor");
  assert.equal(pkg.private, true);
  assert.ok(pkg.dependencies["@empire/batteries-dna"]);

  const engineSrc = readFileSync(resolve(root, "src/engine.ts"), "utf8");
  assert.match(engineSrc, /getBatteriesDna/);
  assert.match(engineSrc, /resolveDnaSensors/);
  assert.match(engineSrc, /getWorldMonitoringSnapshot/);

  // Validate that key DNA sensor targets are explicitly wired
  const expectedDnaSensors = ["basir", "matin", "hayy", "hafiz", "khabir", "nur", "alim", "sami"];
  for (const code of expectedDnaSensors) {
    assert.match(engineSrc, new RegExp(`code:\\s*"${code}"`));
  }
});
