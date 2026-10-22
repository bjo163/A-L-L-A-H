import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, dirname, sep } from "node:path";
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
await inventory(manifest.vectors.domainSymbols, /export const domainSymbolNames = \[([\s\S]*?)\] as const/, "domain symbols");
await inventory(manifest.vectors.brandConcepts, /export type BrandConcept = ([^;]+);/, "brand concepts");

const iconSource = await read(manifest.vectors.icons.source);
const sizeMatch = iconSource.match(/export const iconDisplaySizes = \[([\s\S]*?)\] as const/);
const displaySizes = sizeMatch ? [...sizeMatch[1].matchAll(/\b(\d+)\b/g)].map((match) => Number(match[1])) : [];
const recommendedDisplaySizes = manifest.vectors.icons.strokeFamily?.recommendedDisplaySizes;
if (!sizeMatch || JSON.stringify(displaySizes) !== JSON.stringify(recommendedDisplaySizes)) errors.push("icon display sizes must match the recommended optical sizes in asset-manifest.json");
if (!displaySizes.length || displaySizes.some((size, index) => size < 16 || (index > 0 && size <= displaySizes[index - 1]))) errors.push("icon display sizes must be ascending and at least 16 CSS px");
const iconSvg = iconSource.match(/<svg\b([\s\S]*?)>/)?.[1] ?? "";
const family = manifest.vectors.icons.strokeFamily;
const expectedIconRoot = {
  viewBox: `viewBox="${family?.viewBox}"`,
  stroke: `stroke="${family?.stroke}"`,
  strokeWidth: `strokeWidth="${family?.strokeWidth}"`,
  strokeLinecap: `strokeLinecap="${family?.strokeLinecap}"`,
  strokeLinejoin: `strokeLinejoin="${family?.strokeLinejoin}"`,
};
for (const [name, attribute] of Object.entries(expectedIconRoot)) {
  if (!family || !iconSvg.includes(attribute)) errors.push(`icon family ${family?.name ?? "(unnamed)"}: root SVG ${name} differs from the manifest contract`);
}
const pathRegistry = iconSource.match(/const paths:[\s\S]*?= \{([\s\S]*?)\n\};\n\ntype IconProps/)?.[1]
  ?? iconSource.match(/((?:function [A-Za-z]+Glyph\(\): ReactNode \{[\s\S]*?\}\n)+)\nconst glyphs:/)?.[1]
  ?? "";
if (!pathRegistry) errors.push("icon path definitions could not be inspected for per-icon stroke overrides");
else if (/\b(?:stroke|strokeWidth|strokeLinecap|strokeLinejoin)\s*[:=]/.test(pathRegistry)) errors.push(`icon family ${family?.name ?? "(unnamed)"}: individual paths override the shared stroke family`);
if (/\b(?:id|href|xlinkHref|mask|filter)\s*=|<(?:defs|symbol|linearGradient|radialGradient|mask|filter|pattern)\b|url\s*\(/i.test(pathRegistry)) errors.push("icon path definitions must remain definition-free so repeated icons cannot collide through IDs, masks, filters, or paint references");
if (family?.perIconOverrides !== false) errors.push("icon stroke family must explicitly prohibit per-icon stroke overrides");
if (!family?.name || !manifest.vectors.icons.provenance || !manifest.vectors.icons.licenseStatus) errors.push("icon family requires a name, provenance, and explicit license status");
const domainSource = await read(manifest.vectors.domainSymbols.source);
const domainSvg = domainSource.match(/<svg\b([\s\S]*?)>/)?.[1] ?? "";
const domainPaths = domainSource.match(/const symbolPaths:[\s\S]*?= \{([\s\S]*?)\n\};\n\nexport type DomainSymbolProps/)?.[1] ?? "";
for (const [name, attribute] of Object.entries(expectedIconRoot)) {
  if (!domainSvg.includes(attribute)) errors.push(`domain symbols must share ${family?.name ?? "the icon family"}: root SVG ${name} differs from the manifest contract`);
}
if (!domainPaths) errors.push("domain symbol path registry could not be inspected for family overrides");
else if (/\b(?:stroke|strokeWidth|strokeLinecap|strokeLinejoin)\s*[:=]/.test(domainPaths)) errors.push("domain symbols must not override the shared stroke family");
if (manifest.vectors.domainSymbols.strokeFamily !== family?.name || !manifest.vectors.domainSymbols.provenance) errors.push("domain symbols require the shared icon stroke family and provenance");
const iconLicense = await read("licenses/ICONS.md");
if (!iconLicense.includes("created from scratch") || !iconLicense.includes("no third-party") || !iconLicense.includes("does not grant a license")) errors.push("licenses/ICONS.md must document original authorship, third-party exclusion, and current reuse limits");

const pkg = JSON.parse(await readFile(resolve(uiRoot, "package.json"), "utf8"));
const styles = await read("src/styles.css");
for (const font of manifest.fonts) {
  if (pkg.dependencies?.[font.package] !== font.version) errors.push(`${font.package}: package version differs from manifest`);
  for (const importPath of font.imports) if (!styles.includes(`@import \"${importPath}\"`)) errors.push(`${font.package}: stylesheet import missing: ${importPath}`);
  try { await readFile(resolve(uiRoot, font.licenseFile)); } catch { errors.push(`${font.package}: license file missing: ${font.licenseFile}`); }
}
const expectedGeneratedDirectory = "assets/generated";
if (manifest.generatedAssetDirectory !== expectedGeneratedDirectory) errors.push(`generatedAssetDirectory must remain ${expectedGeneratedDirectory}`);
const generatedRoot = resolve(uiRoot, expectedGeneratedDirectory);
const expectedGenerated = new Map();
if (!Array.isArray(manifest.generatedFiles)) {
  errors.push("generatedFiles must be an array of path and SHA-256 records");
} else {
  for (const asset of manifest.generatedFiles) {
    if (typeof asset?.path !== "string" || !/^[a-f0-9]{64}$/i.test(asset.sha256 ?? "")) {
      errors.push("generatedFiles entries require a relative path and 64-character SHA-256 digest");
      continue;
    }
    const absolute = resolve(uiRoot, asset.path);
    const withinGenerated = relative(generatedRoot, absolute);
    const allowedGeneratedSource = ["src/brand/OrbitMark.generated.tsx", "src/brand/BrandAssets.generated.ts"].includes(asset.path);
    if (isAbsolute(asset.path) || (!allowedGeneratedSource && (withinGenerated === "" || withinGenerated === ".." || withinGenerated.startsWith(`..${sep}`) || isAbsolute(withinGenerated)))) {
      errors.push(`generated asset path must point to a file beneath ${manifest.generatedAssetDirectory}: ${asset.path}`);
      continue;
    }
    expectedGenerated.set(asset.path.replaceAll("\\", "/"), asset.sha256.toLowerCase());
  }
}
const actualGenerated = new Map();
async function walkGenerated(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return; throw error; }
  for (const entry of entries) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) await walkGenerated(absolute);
    else if (entry.isFile()) {
      const path = relative(uiRoot, absolute).split(sep).join("/");
      const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
      actualGenerated.set(path, digest);
    }
  }
}
await walkGenerated(generatedRoot);
const generatedComponentPath = "src/brand/OrbitMark.generated.tsx";
for (const generatedSource of [generatedComponentPath, "src/brand/BrandAssets.generated.ts"]) {
  try {
    const contents = await read(generatedSource);
    actualGenerated.set(generatedSource, createHash("sha256").update(contents).digest("hex"));
  } catch (error) { if (error.code !== "ENOENT") throw error; }
}
for (const path of new Set([...actualGenerated.keys(), ...expectedGenerated.keys()])) {
  if (!expectedGenerated.has(path)) errors.push(`generated asset missing from manifest: ${path}`);
  else if (!actualGenerated.has(path)) errors.push(`manifested generated asset is missing: ${path}`);
  else if (actualGenerated.get(path) !== expectedGenerated.get(path)) errors.push(`generated asset hash drift: ${path}`);
}
if (!manifest.generatedAssetPolicy?.includes("inline SVG")) errors.push("generated asset policy must document the current inline-SVG source strategy");
if (manifest.generatedFiles.length > 0 && !manifest.generatedAssetPolicy?.includes("assets:generate")) errors.push("generated assets require a documented deterministic generation command");
if (!manifest.generatedAssetPolicy?.includes("single editable Orbit geometry source")) errors.push("generated asset policy must identify the single editable Orbit geometry source");
if (manifest.vectors.brandMaster?.source !== "assets/source/brand/orbit.svg" || manifest.vectors.brandMaster?.componentOutput !== "src/brand/OrbitMark.generated.tsx" || manifest.vectors.brandMaster?.assetModuleOutput !== "src/brand/BrandAssets.generated.ts") errors.push("brand master manifest must point from the editable SVG to its generated React component and public asset module");
try {
  const master = await read("assets/source/brand/orbit.svg");
  if (!/<svg\b[^>]*viewBox="0 0 72 72"/i.test(master)) errors.push("editable Orbit SVG master requires viewBox 0 0 72 72");
  if (/<(?:script|foreignObject|image|use)\b/i.test(master) || /\b(?:href|xlink:href)=/i.test(master)) errors.push("editable Orbit SVG master contains an external or unsafe element/reference");
} catch { errors.push("editable Orbit SVG master is missing"); }
const manifestOutputs = (manifest.vectors.brandMaster?.assetOutputs ?? []).slice().sort();
const generatedSvgOutputs = manifest.generatedFiles.filter(({ path }) => path.startsWith(`${manifest.generatedAssetDirectory}/`)).map(({ path }) => path).sort();
if (JSON.stringify(manifestOutputs) !== JSON.stringify(generatedSvgOutputs)) errors.push("brand master asset outputs differ from the generated-file inventory");
for (const asset of manifest.generatedFiles) {
  if (!asset.path.endsWith(".svg")) continue;
  const contents = await readFile(resolve(uiRoot, asset.path), "utf8").catch(() => "");
  if (!contents.startsWith("<svg ") || !contents.includes("viewBox=\"0 0 72 72\"")) errors.push(`generated SVG requires a 72-unit master viewBox: ${asset.path}`);
  if (/<(?:script|foreignObject|image|use)\b/i.test(contents) || /\b(?:href|xlink:href)=/i.test(contents)) errors.push(`generated SVG contains an external or unsafe element/reference: ${asset.path}`);
}

if (errors.length) {
  console.error(`UI asset manifest validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`UI asset manifest valid: ${manifest.vectors.icons.names.length} icons, ${manifest.vectors.domainSymbols.names.length} domain symbols, ${manifest.vectors.brandConcepts.names.length} brand concepts, ${manifest.fonts.length} licensed font packages, ${manifest.generatedFiles.length} generated files.`);
}
