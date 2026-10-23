import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Moonwitness public pages describe the current product and planned systems", async () => {
  const home = await source("../app/MoonwitnessExperience.tsx");
  const systems = await source("../app/systems/page.tsx");
  const roadmap = await source("../app/roadmap/page.tsx");
  const systemsData = await source("../lib/web-systems.ts");
  const layout = await source("../app/layout.tsx");

  assert.match(home, /MOON/);
  assert.match(home, /WITNESS/);
  assert.match(systems, /SYSTEM ATLAS|ATLAS SISTEM/);
  assert.match(roadmap, /BELUM TERPASANG/);
  assert.match(systemsData, /Q-REALM/);
  assert.match(systemsData, /Model AI hanyalah salah satu kemampuan dasar/);
  assert.match(systemsData, /No invented quantum advantage/i);
  assert.match(layout, /title:.*MOONWITNESS/);
  assert.match(layout, /robots: \{ index: true, follow: true \}/);
  assert.doesNotMatch(home, /98\.7%|BELIEF-TRUTH ALIGNMENT/);
});

test("public content links stay on public routes; SHADOW remains the private entry", async () => {
  const home = await source("../app/MoonwitnessExperience.tsx");
  const nav = await source("../components/PrimaryNavigation.tsx");
  const layout = await source("../app/layout.tsx");
  const stories = await source("../app/stories/page.tsx");

  assert.match(home, /href="\/stories"/);
  assert.match(home, /href="\/#crew"/);
  assert.match(home, /href="\/#signal"/);
  assert.match(home, /href="\/#archive"/);
  assert.match(home, /SHADOW COMMAND CENTER/);
  assert.match(nav, /href: "\/#crew"/);
  assert.match(nav, /href: "\/#signal"/);
  assert.match(nav, /href: "\/#archive"/);
  assert.match(home, /<footer[^]*href="\/workspace"[^]*SHADOW COMMAND CENTER/);
  assert.match(layout, /JOIN THE CREW<\/IconText><\/Link>/);
  assert.match(layout, /href="\/\#crew"/);
  assert.match(layout, /github\.com\/bjo163\/A-L-L-A-H/);
  assert.doesNotMatch(layout, /\/#(?:ekosistem|identitas)|github\.com\/bjo163\/empire-of-the-light/);
  assert.match(stories, /not available yet|belum tersedia/i);
});

test("world traditions preserve their distinct status from empirical claims", async () => {
  const systemsData = await source("../lib/web-systems.ts");
  const explorer = await source("../components/Explorer.tsx");

  assert.match(systemsData, /Daoist and Shinto/);
  assert.match(explorer, /not a live physical device/);
  assert.match(systemsData, /No invented quantum advantage|no invented quantum advantage/i);
});

test("public routes retain language, shared navigation, page chrome, and loading semantics", async () => {
  const nav = await source("../components/PrimaryNavigation.tsx");
  const layout = await source("../app/layout.tsx");
  const chrome = await source("../components/PageChrome.tsx");
  const loading = await source("../components/RouteLoading.tsx");
  const explorer = await source("../components/Explorer.tsx");
  const sharedLoading = await source("../../../packages/ui/src/patterns/MangaLoadingState.tsx");

  assert.match(nav, /eol-language=\$\{nextLanguage\}/);
  assert.match(nav, /href: "\/#crew"/);
  assert.match(nav, /href: "\/systems"/);
  assert.match(nav, /href: "\/#signal"/);
  assert.match(nav, /href: "\/#archive"/);
  assert.match(layout, /lang=\{language\}/);
  assert.match(chrome, /PageIntro/);
  assert.match(chrome, /PageCrosslinks/);
  assert.match(loading, /<MangaLoadingState/);
  assert.match(sharedLoading, /role="status"/);
  assert.match(explorer, /getWebSystems\(language\)/);
});
