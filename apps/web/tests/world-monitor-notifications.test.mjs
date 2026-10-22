import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/world-monitor-notifications.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const load = new Function("exports", `${compiled}; return notifyNewWorldMonitorAlerts;`);
const notifyAlerts = load({});

test("notifications send once for unseen alerts and prefer critical", () => {
  const sent = [];
  const previous = [{ id: "known", level: "advisory", title: "Known", detail: "old" }];
  const next = [
    ...previous,
    { id: "new-a", level: "advisory", title: "Advisory", detail: "new" },
    { id: "new-c", level: "critical", title: "Critical", detail: "urgent" },
  ];
  assert.equal(notifyAlerts(previous, next, "granted", (title, body) => sent.push({ title, body })), 2);
  assert.equal(sent.length, 1);
  assert.match(sent[0].title, /CRITICAL/);
  assert.equal(notifyAlerts(next, next, "granted", (title, body) => sent.push({ title, body })), 0);
  assert.equal(sent.length, 1);
});

test("a severity escalation notifies once and subsequent identical refresh does not", () => {
  const previous = [{ id: "alert", level: "advisory", title: "Air quality", detail: "high" }];
  const current = [{ id: "alert", level: "critical", title: "Air quality", detail: "very high" }];
  let sent = 0;
  assert.equal(notifyAlerts(previous, current, "granted", () => { sent += 1; }), 1);
  assert.equal(notifyAlerts(current, current, "granted", () => { sent += 1; }), 0);
  assert.equal(sent, 1);
});

test("notification preference never sends without browser permission", () => {
  let sent = 0;
  const count = notifyAlerts([], [{ id: "a", level: "critical", title: "A", detail: "B" }], "default", () => { sent += 1; });
  assert.equal(count, 0);
  assert.equal(sent, 0);
});
