import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("YouTube Sentinel 12-hour scheduler is registered and configured with proper defaults", async () => {
  const schedulerSource = await readFile(new URL("../src/youtube-sentinel-scheduler.ts", import.meta.url), "utf8");
  const serverSource = await readFile(new URL("../src/server.ts", import.meta.url), "utf8");

  // Verify scheduler definitions
  assert.match(schedulerSource, /TWELVE_HOURS_MS = 12 \* 60 \* 60 \* 1000/);
  assert.match(schedulerSource, /startYoutubeSentinelScheduler/);
  assert.match(schedulerSource, /executeScheduledYoutubeSweep/);
  assert.match(schedulerSource, /sortBy:\s*"upload_date"/);
  assert.match(schedulerSource, /triggeredBy:\s*"scheduler_12h"/);

  // Verify server startup hooks
  assert.match(serverSource, /startYoutubeSentinelScheduler/);
  assert.match(serverSource, /stopYoutubeSentinelScheduler/);

  // Verify default syirik & occultism query coverage
  assert.match(schedulerSource, /pesugihan uang gaib/);
  assert.match(schedulerSource, /dukun santet/);
  assert.match(schedulerSource, /jimat pelet/);
  assert.match(schedulerSource, /khodam pendamping/);
  assert.match(schedulerSource, /larung sesaji/);
});
