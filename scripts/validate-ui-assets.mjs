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
await inventory(manifest.vectors.brandConcepts, /export type BrandConcept = ([^;]+);/, "brand concepts");

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
    if (isAbsolute(asset.path) || withinGenerated === "" || withinGenerated === ".." || withinGenerated.startsWith(`..${sep}`) || isAbsolute(withinGenerated)) {
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
for (const path of new Set([...actualGenerated.keys(), ...expectedGenerated.keys()])) {
  if (!expectedGenerated.has(path)) errors.push(`generated asset missing from manifest: ${path}`);
  else if (!actualGenerated.has(path)) errors.push(`manifested generated asset is missing: ${path}`);
  else if (actualGenerated.get(path) !== expectedGenerated.get(path)) errors.push(`generated asset hash drift: ${path}`);
}
if (!manifest.generatedAssetPolicy?.includes("inline SVG")) errors.push("generated asset policy must document the current inline-SVG source strategy");
if (manifest.generatedFiles.length > 0 && !manifest.generatedAssetPolicy?.includes("assets:generate")) errors.push("generated assets require a documented deterministic generation command");
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
  console.log(`UI asset manifest valid: ${manifest.vectors.icons.names.length} icons, ${manifest.vectors.brandConcepts.names.length} brand concepts, ${manifest.fonts.length} licensed font packages, ${manifest.generatedFiles.length} generated files.`);
}
