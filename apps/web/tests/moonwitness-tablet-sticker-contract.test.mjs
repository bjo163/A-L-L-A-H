import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const styles = await readFile(new URL("../../../packages/ui/src/products/portal-manga.css", import.meta.url), "utf8");

test("Moonwitness tablet hero sticker moves to the upper-right, clear of the CTA row", () => {
  const tabletRule = styles.match(/@media\s*\(min-width:\s*571px\)\s*and\s*\(max-width:\s*800px\)\s*\{([^}]*)\}/);
  assert.ok(tabletRule, "tablet-only sticker rule exists");
  assert.match(tabletRule[1], /\.mw-hero-sticker\s*\{[^}]*top:\s*8%/);
  assert.match(tabletRule[1], /right:\s*4%/);
  assert.match(tabletRule[1], /bottom:\s*auto/);
  assert.match(tabletRule[0], /min-width:\s*571px/);
  assert.match(tabletRule[0], /max-width:\s*800px/);
});
