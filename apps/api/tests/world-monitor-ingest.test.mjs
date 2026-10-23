import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { WorldMonitorObservationModel } from "@empire/batteries-base";

const source = await readFile(new URL("../src/world-monitor-ingest.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const loadParsers = new Function("exports", "require", "getDatabase", `const createHash = require("node:crypto").createHash;\n${compiled}; return { parseOpenMeteo, parseQuakes, parseKp, parseDisasters, parseObservedAt, worldMonitorObservationIdentity };`);
const parsers = loadParsers({}, (name) => name === "node:crypto" ? { createHash } : {}, () => ({ transaction: (callback) => callback({ raw: async () => {} }) }));
const fixture = async (name) => JSON.parse(await readFile(new URL(`./fixtures/world-monitor/${name}.json`, import.meta.url), "utf8"));

test("sanitized recorded fixtures execute every provider parser", async () => {
  const weatherFixture = await fixture("open-meteo-weather");
  const weather = parsers.parseOpenMeteo(weatherFixture)[0];
  assert.equal(weather.observedAt, "2026-10-22T04:45:00.000Z");
  assert.equal(weather.normalized.temperature_2m, 10.3);

  const airQuality = parsers.parseOpenMeteo(await fixture("open-meteo-air-quality"))[0];
  assert.equal(airQuality.normalized.pm2_5, 6.4);

  const quake = parsers.parseQuakes(await fixture("usgs-earthquakes"))[0];
  assert.equal(quake.externalId, "fixture-usgs-001");
  assert.deepEqual(quake.normalized.coordinates, [106.8, -6.2, 10]);

  const estimatedKp = parsers.parseKp(await fixture("noaa-kp-estimated"))[0];
  assert.equal(estimatedKp.normalized.kp, 2);
  assert.equal(estimatedKp.normalized.kpKind, "near-real-time estimate");
  const reportedKp = parsers.parseKp(await fixture("noaa-kp-reported"))[0];
  assert.equal(reportedKp.normalized.kp, 3.67);
  assert.equal(reportedKp.normalized.kpKind, "reported");

  const disaster = parsers.parseDisasters(await fixture("gdacs-disasters"))[0];
  assert.equal(disaster.externalId, "fixture-gdacs-001");
  assert.equal(disaster.normalized.alertlevel, "Green");
});

test("sanitized malformed primary and fallback provider fixtures fail parser validation", async () => {
  const malformedWeather = await fixture("open-meteo-malformed");
  const malformedWeatherFallback = await fixture("open-meteo-fallback-malformed");
  const malformedQuakes = await fixture("usgs-malformed");
  const malformedFdsnFallback = await fixture("usgs-fdsn-malformed");
  const malformedKp = await fixture("noaa-kp-malformed");
  const malformedKpFallback = await fixture("noaa-kp-final-malformed");
  const malformedDisasters = await fixture("gdacs-malformed");
  assert.throws(() => parsers.parseOpenMeteo(malformedWeather), /timestamp is invalid/);
  assert.throws(() => parsers.parseOpenMeteo(malformedWeatherFallback), /missing coordinates or current values/);
  assert.throws(() => parsers.parseQuakes(malformedQuakes), /invalid ID, timestamp, or coordinates/);
  assert.throws(() => parsers.parseQuakes(malformedFdsnFallback), /no feature list/);
  assert.throws(() => parsers.parseKp(malformedKp), /Kp value is invalid/);
  assert.throws(() => parsers.parseKp(malformedKpFallback), /no latest row/);
  assert.throws(() => parsers.parseDisasters(malformedDisasters), /timestamp is missing/);
});

test("timestamps without offsets normalize as UTC and NOAA estimated Kp retains its source kind", () => {
  assert.equal(parsers.parseObservedAt("2026-10-22T04:46:00"), "2026-10-22T04:46:00.000Z");
  assert.equal(parsers.parseObservedAt("2026-10-22T06:46:00+02:00"), "2026-10-22T04:46:00.000Z");
});

test("valid empty provider feeds remain an empty result, not a parse error", () => {
  assert.deepEqual(parsers.parseQuakes({ features: [] }), []);
  assert.deepEqual(parsers.parseDisasters({ events: [] }), []);
});

test("observation identities are stable across repeated provider polls", () => {
  const first = parsers.worldMonitorObservationIdentity("usgs-earthquakes", { externalId: "usgs-1", observedAt: "2026-10-22T04:46:00.000Z", normalized: { mag: 4.2 } });
  const repeated = parsers.worldMonitorObservationIdentity("usgs-earthquakes", { externalId: "usgs-1", observedAt: "2026-10-22T04:46:00.000Z", normalized: { mag: 4.2 } });
  const anonymousA = parsers.worldMonitorObservationIdentity("open-meteo-weather-london", { observedAt: "2026-10-22T04:46:00.000Z", normalized: { temperature_2m: 14 } });
  const anonymousB = parsers.worldMonitorObservationIdentity("open-meteo-weather-london", { observedAt: "2026-10-22T04:46:00.000Z", normalized: { temperature_2m: 14 } });
  assert.deepEqual(first, repeated);
  assert.deepEqual(anonymousA, anonymousB);
  assert.equal(anonymousA.externalId.length, 64);
});

test("observation model declares the database identity used by repeated provider polls", () => {
  assert.deepEqual(WorldMonitorObservationModel.uniqueConstraints, [["source", "externalId", "observedAt"]]);
});
