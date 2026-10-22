import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const uiRoot = resolve(root, "packages/ui");
const manifest = JSON.parse(await readFile(resolve(uiRoot, "assets/asset-manifest.json"), "utf8"));
const errors = [];
const read = (path) => readFile(resolve(uiRoot, path), "utf8");
const inventory = async (entry, pattern, label) => {
  const source = await read(entry.source);
  const match = source.match(pattern);
  if (!match) { errors.push(`${label}: inventory declaration not found in ${entry.source}`); return; }
  const actual = [...match[1].matchAll(/"([A-Za-z][A-Za-z0-9]*)"/g)].map((item) => item[1]);
  const expected = entry.names;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${label}: manifest/source drift (manifest ${expected.length}, source ${actual.length}); update the manifest after reviewing the asset change`);
  }
};

await inventory(manifest.vectors.icons, /export const iconNames = \[([\s\S]*?)\] as const/, "icons");
await inventory(manifest.vectors.brandConcepts, /export type BrandConcept = ([^;]+);/, "brand concepts");

const pkg = JSON.parse(await readFile(resolve(uiRoot, "package.json"), "utf8"));
const styles = await read("src/styles.css");
for (const font of manifest.fonts) {
  if (pkg.dependencies?.[font.package] !== font.version) errors.push(`${font.package}: package version differs from manifest`);
  for (const importPath of font.imports) if (!styles.includes(`@import \"${importPath}\"`)) errors.push(`${font.package}: stylesheet import missing: ${importPath}`);
  try { await readFile(resolve(uiRoot, font.licenseFile)); } catch { errors.push(`${font.package}: license file missing: ${font.licenseFile}`); }
}
if (!Array.isArray(manifest.generatedFiles) || manifest.generatedFiles.length !== 0) {
  errors.push("generatedFiles must list reviewed generated assets; no generated asset output is currently expected");
}
if (!manifest.generatedAssetPolicy?.includes("inline SVG")) errors.push("generated asset policy must document the current inline-SVG source strategy");

if (errors.length) {
  console.error(`UI asset manifest validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`UI asset manifest valid: ${manifest.vectors.icons.names.length} icons, ${manifest.vectors.brandConcepts.names.length} brand concepts, ${manifest.fonts.length} licensed font packages; no generated files expected.`);
}
