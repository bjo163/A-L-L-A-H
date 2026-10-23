import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const page = await readFile(new URL("../app/MoonwitnessExperience.tsx", import.meta.url), "utf8");

test("Moonwitness homepage selects localized copy from the active language", () => {
  assert.match(page, /export function MoonwitnessExperience\(\{ language \}: \{ language: WebLanguage \}\)/);
  assert.match(page, /const t = copy\[language\]/);
  assert.doesNotMatch(page, /language: _language/);
  assert.match(page, /en: \{/);
  assert.match(page, /id: \{/);
});

test("homepage English and Indonesian copy cover the same set of visible content", () => {
  const start = page.indexOf("const copy = {");
  const end = page.indexOf("} as const;", start);
  assert.ok(start >= 0 && end > start, "bilingual homepage copy table exists");
  const table = page.slice(start, end);
  const locales = [...table.matchAll(/^  (en|id): \{([\s\S]*?)^  \},?$/gm)];
  assert.equal(locales.length, 2);

  const keysFor = (body) => [...body.matchAll(/^    ([A-Za-z][A-Za-z0-9]*):/gm)].map((match) => match[1]).sort();
  assert.deepEqual(keysFor(locales[0][2]), keysFor(locales[1][2]));
  assert.match(table, /storiesImage: \[/);
  assert.match(table, /heroArt:/);
  assert.match(table, /shadowAria:/);
  assert.match(table, /crewImage:/);
});

test("visible homepage copy and image descriptions are rendered from the locale table", () => {
  for (const key of [
    "heroKicker", "follow", "tagline", "explore", "watch", "stories", "crew", "universe",
    "signal", "archive", "joinMovement", "joinCrew", "footer", "crewImage", "signalImage", "cityImage",
  ]) {
    assert.match(page, new RegExp(`\\{t\\.${key}\\}`), `${key} is localized in the rendered homepage`);
  }
  assert.match(page, /aria-label=\{language === "id" \?/);
});
