import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/world-monitor-notifications.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const load = new Function("exports", `${compiled}; return { notifyNewWorldMonitorAlerts, isWorldMonitorQuietNow, createWorldMonitorAlertPoller };`);
const { notifyNewWorldMonitorAlerts: notifyAlerts, isWorldMonitorQuietNow, createWorldMonitorAlertPoller } = load({});
const defaults = {
  categories: { atmosphere: true, "space-weather": true, earthquake: true, disaster: true },
  quietHours: { enabled: false, start: "22:00", end: "07:00" },
};

test("production notification poller establishes a baseline, deduplicates, and reports escalation", async () => {
  const notifications = [];
  let current = [{ id: "earthquake:USGS:earthquake:sample-1", category: "earthquake", level: "advisory", title: "Earthquake", detail: "M5", observedAt: "2026-10-23T10:01:00Z" }];
  const poller = createWorldMonitorAlertPoller({
    fetchAlerts: async () => current,
    getPermission: () => "granted",
    getPreferences: () => defaults,
    notify: (title, body) => notifications.push({ title, body }),
    now: () => new Date("2026-10-23T10:00:00Z"),
  });
  await poller.poll();
  assert.equal(notifications.length, 0, "first poll establishes the comparison baseline without notifying");
  await poller.poll();
  assert.equal(notifications.length, 0, "repeated identical poll is deduplicated");
  current = [{ ...current[0], level: "critical", detail: "M7" }];
  await poller.poll();
  assert.equal(notifications.length, 1, "severity escalation sends exactly one notification");
  await poller.poll();
  assert.equal(notifications.length, 1, "unchanged critical poll remains deduplicated");
  poller.stop();
  await poller.poll();
  assert.equal(notifications.length, 1, "stopped polling cannot send after effect cleanup");
});

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

test("old or timestamp-less observations do not notify during a later refresh", () => {
  const sent = [];
  const previous = [{ id: "known", level: "advisory", title: "Known", detail: "old", observedAt: "2026-10-23T10:00:00Z" }];
  const current = [
    { id: "historic", level: "critical", title: "Historic", detail: "old event", observedAt: "2026-10-23T09:00:00Z" },
    { id: "missing-time", level: "critical", title: "Unknown time", detail: "no timestamp" },
    { id: "new", level: "critical", title: "New", detail: "fresh event", observedAt: "2026-10-23T10:01:00Z" },
  ];
  assert.equal(notifyAlerts(previous, current, "granted", (title, body) => sent.push({ title, body }), "2026-10-23T10:00:00Z"), 1);
  assert.equal(sent.length, 1);
  assert.match(sent[0].body, /New/);
});

test("an invalid baseline timestamp fails closed", () => {
  let sent = 0;
  const current = [{ id: "new", level: "critical", title: "New", detail: "fresh", observedAt: "2026-10-23T10:01:00Z" }];
  assert.equal(notifyAlerts([], current, "granted", () => { sent += 1; }, "not-a-date"), 0);
  assert.equal(sent, 0);
});

test("category preferences suppress only opted-out categories", () => {
  const sent = [];
  const current = [
    { id: "quake", level: "advisory", category: "earthquake", title: "Quake", detail: "M5" },
    { id: "air", level: "critical", category: "atmosphere", title: "Air", detail: "PM2.5" },
  ];
  const preferences = { ...defaults, categories: { ...defaults.categories, earthquake: false } };
  assert.equal(notifyAlerts([], current, "granted", (title, body) => sent.push({ title, body }), undefined, preferences), 1);
  assert.equal(sent.length, 1);
  assert.match(sent[0].body, /Air/);
});

test("quiet hours suppress advisories while still delivering critical hazards", () => {
  const sent = [];
  const preferences = { ...defaults, quietHours: { enabled: true, start: "22:00", end: "07:00" } };
  const current = [
    { id: "advisory", level: "advisory", category: "earthquake", title: "Advisory", detail: "M5" },
    { id: "critical", level: "critical", category: "disaster", title: "Critical", detail: "Red alert" },
  ];
  const count = notifyAlerts([], current, "granted", (title, body) => sent.push({ title, body }), undefined, preferences, new Date(2026, 0, 1, 23, 30));
  assert.equal(count, 1);
  assert.equal(sent.length, 1);
  assert.match(sent[0].body, /Critical/);
  assert.equal(notifyAlerts([], [current[0]], "granted", () => sent.push({}), undefined, preferences, new Date(2026, 0, 1, 23, 30)), 0);
});

test("quiet hours support ranges crossing midnight and invalid ranges fail open", () => {
  const crossing = { enabled: true, start: "22:00", end: "07:00" };
  assert.equal(isWorldMonitorQuietNow(crossing, new Date(2026, 0, 1, 2, 0)), true);
  assert.equal(isWorldMonitorQuietNow(crossing, new Date(2026, 0, 1, 8, 0)), false);
  assert.equal(isWorldMonitorQuietNow({ enabled: true, start: "bad", end: "07:00" }, new Date(2026, 0, 1, 2, 0)), false);
});

test("disappear and reappear keeps one event notification while a later escalation still alerts", () => {
  const knownLevels = new Map([["quake-event", "advisory"]]);
  const advisory = { id: "quake-event", level: "advisory", category: "earthquake", title: "Quake", detail: "M5" };
  const critical = { ...advisory, level: "critical", detail: "M7" };
  let sent = 0;
  assert.equal(notifyAlerts([advisory], [], "granted", () => { sent += 1; }, undefined, defaults, new Date(), knownLevels), 0);
  assert.equal(notifyAlerts([], [advisory], "granted", () => { sent += 1; }, undefined, defaults, new Date(), knownLevels), 0);
  assert.equal(notifyAlerts([advisory], [critical], "granted", () => { sent += 1; }, undefined, defaults, new Date(), knownLevels), 1);
  assert.equal(notifyAlerts([], [critical], "granted", () => { sent += 1; }, undefined, defaults, new Date(), knownLevels), 0);
  assert.equal(sent, 1);
});
