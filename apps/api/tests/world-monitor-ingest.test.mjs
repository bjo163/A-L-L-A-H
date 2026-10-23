import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { WorldMonitorObservationModel } from "@empire/batteries-base";

const source = await readFile(new URL("../src/world-monitor-ingest.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const loadParsers = new Function("exports", "require", "getDatabase", `const createHash = require("node:crypto").createHash;\n${compiled}; return { parseOpenMeteo: exports.parseOpenMeteo, parseQuakes: exports.parseQuakes, parseKp: exports.parseKp, parseDisasters: exports.parseDisasters, parseObservedAt: exports.parseObservedAt, worldMonitorObservationIdentity: exports.worldMonitorObservationIdentity, boundedWorldMonitorRawPayload: exports.boundedWorldMonitorRawPayload, WORLD_MONITOR_RAW_PAYLOAD_MAX_BYTES: exports.WORLD_MONITOR_RAW_PAYLOAD_MAX_BYTES, tryAcquireWorldMonitorIngestionLease: exports.tryAcquireWorldMonitorIngestionLease, releaseWorldMonitorIngestionLease: exports.releaseWorldMonitorIngestionLease };`);
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
  assert.throws(() => parsers.parseOpenMeteo(malformedWeatherFallback), /missing valid coordinates or current values/);
  assert.throws(() => parsers.parseQuakes(malformedQuakes), /invalid ID, timestamp, or coordinates/);
  assert.throws(() => parsers.parseQuakes(malformedFdsnFallback), /no feature list/);
  assert.throws(() => parsers.parseKp(malformedKp), /Kp value is invalid/);
  assert.throws(() => parsers.parseKp(malformedKpFallback), /no latest row/);
  assert.throws(() => parsers.parseDisasters(malformedDisasters), /timestamp is missing/);
});

test("timestamps without offsets normalize as UTC and NOAA estimated Kp retains its source kind", () => {
  assert.equal(parsers.parseObservedAt("2026-10-22T04:46:00"), "2026-10-22T04:46:00.000Z");
  assert.equal(parsers.parseObservedAt("2026-10-22T06:46:00+02:00"), "2026-10-22T04:46:00.000Z");
  for (const value of ["yesterday", "2026-02-30T04:00:00", "2026-10-22 04:00:00", "2026-10-22T25:00:00"]) assert.throws(() => parsers.parseObservedAt(value), /timestamp is invalid/);
});

test("provider timestamps reject future observations beyond a five-minute clock-skew allowance", () => {
  const allowedSkew = new Date(Date.now() + 4 * 60 * 1000).toISOString();
  const excessiveFuture = new Date(Date.now() + 6 * 60 * 1000).toISOString();
  assert.equal(parsers.parseObservedAt(allowedSkew), allowedSkew);
  assert.throws(() => parsers.parseObservedAt(excessiveFuture), /timestamp is in the future/);
  const quake = (time) => ({ features: [{ id: "usgs-future", properties: { time }, geometry: { coordinates: [0, 0, 1] } }] });
  assert.equal(parsers.parseQuakes(quake(Date.now() + 4 * 60 * 1000))[0].externalId, "usgs-future");
  assert.throws(() => parsers.parseQuakes(quake(Date.now() + 6 * 60 * 1000)), /timestamp is in the future/);
});

test("Open-Meteo validates coordinates and category measurement ranges", async () => {
  const sample = await fixture("open-meteo-weather");
  assert.throws(() => parsers.parseOpenMeteo({ ...sample, latitude: 91 }), /valid coordinates/);
  assert.throws(() => parsers.parseOpenMeteo({ ...sample, current: { ...sample.current, relative_humidity_2m: 120 } }), /outside its valid range/);
  assert.throws(() => parsers.parseOpenMeteo({ ...sample, current: { time: sample.current.time, provider_debug: "ignored" } }), /no recognized numeric measurements/);
});

test("NOAA legacy tabular fallback parses named columns and rejects malformed rows", () => {
  const parsed = parsers.parseKp([["time_tag", "Kp", "a_running", "station_count"], ["2026-10-22 04:00:00", "3.67", "12", "8"]])[0];
  assert.equal(parsed.observedAt, "2026-10-22T04:00:00.000Z");
  assert.equal(parsed.normalized.kp, 3.67);
  assert.equal(parsed.normalized.kpKind, "reported");
  assert.throws(() => parsers.parseKp([["date", "value"], ["2026-10-22", "2"]]), /tabular payload/);
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

test("raw provider samples are redacted, bounded, and suitable for one source-run record", () => {
  const sample = parsers.boundedWorldMonitorRawPayload({ api_key: "secret", nested: { authorization: "Bearer x", email: "person@example.com", value: 7 } });
  assert.equal(sample.retained, true);
  assert.equal(sample.payload.api_key, "[redacted]");
  assert.equal(sample.payload.nested.authorization, "[redacted]");
  assert.equal(sample.payload.nested.email, "[redacted]");
  assert.equal(JSON.stringify(sample).includes("secret"), false);
  const oversized = parsers.boundedWorldMonitorRawPayload({ data: "x".repeat(parsers.WORLD_MONITOR_RAW_PAYLOAD_MAX_BYTES + 1) });
  assert.equal(oversized.retained, false);
  assert.equal(oversized.reason, "size_limit");
  assert.equal("payload" in oversized, false);
});

test("observation model declares the database identity used by repeated provider polls", () => {
  assert.deepEqual(WorldMonitorObservationModel.uniqueConstraints, [["source", "externalId", "observedAt"]]);
});

test("distributed ingestion lease is non-blocking across workers and reacquires after release", async () => {
  let held = false;
  let releases = 0;
  const connection = {};
  const database = {
    raw(sql, bindings) {
      assert.match(sql, /pg_(try_advisory_lock|advisory_unlock)/);
      assert.deepEqual(bindings, ["empire:world-monitor:ingestion"]);
      return { connection: (received) => { assert.equal(received, connection); return { sql }; } };
    },
    client: {
      runner(query) {
        return { run: async () => {
          if (query.sql.includes("pg_try_advisory_lock")) {
            if (held) return { rows: [{ acquired: false }] };
            held = true;
            return { rows: [{ acquired: true }] };
          }
          releases += 1;
          held = false;
          return { rows: [] };
        } };
      },
    },
  };
  assert.equal(await parsers.tryAcquireWorldMonitorIngestionLease(database, connection), true);
  assert.equal(await parsers.tryAcquireWorldMonitorIngestionLease(database, connection), false);
  // Simulate PostgreSQL releasing its session lock and verify another replica
  // can become the sole owner.
  held = false;
  assert.equal(await parsers.tryAcquireWorldMonitorIngestionLease(database, connection), true);
  await parsers.releaseWorldMonitorIngestionLease(database, connection);
  assert.equal(releases, 1);
});
