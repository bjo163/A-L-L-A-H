import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "assets/asset-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const outputRoot = resolve(root, manifest.generatedAssetDirectory);
const mark = `<g fill="none" stroke="#f1b84b" stroke-linecap="round"><circle cx="36" cy="36" r="9" fill="#f1b84b" stroke="none"/><ellipse cx="36" cy="36" rx="29" ry="12" stroke-width="2.5" transform="rotate(-35 36 36)"/><ellipse cx="36" cy="36" rx="29" ry="12" stroke-width="2.5" opacity=".75" transform="rotate(35 36 36)"/><circle cx="59" cy="22" r="4" fill="#f1b84b" stroke="none"/><circle cx="14" cy="47" r="3" fill="#f1b84b" stroke="none"/></g>`;
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="${size}" height="${size}" role="img" aria-label="Empire of the Light"><title>Empire of the Light</title>${mark}</svg>\n`;
const outputs = [
  ["brand/empire-mark.svg", svg(72)],
  ["icons/favicon.svg", svg(32)],
  ["icons/app-icon-32.svg", svg(32)],
  ["icons/app-icon-48.svg", svg(48)],
  ["icons/app-icon-192.svg", svg(192)],
  ["icons/app-icon-512.svg", svg(512)],
];
await mkdir(outputRoot, { recursive: true });
const records = [];
for (const [relativePath, contents] of outputs) {
  const destination = resolve(outputRoot, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents, "utf8");
  records.push({ path: `${manifest.generatedAssetDirectory}/${relativePath}`, sha256: createHash("sha256").update(contents).digest("hex") });
}
manifest.generatedFiles = records;
manifest.generatedAssetPolicy = "Brand concepts are authored as inline SVG components; the provisional Orbit concept in src/brand/BrandConcepts.tsx is the sole editable source for generated mark/favicon/app-icon SVGs. Outputs are deterministic and regenerated with pnpm --filter @empire/ui assets:generate. Final identity approval is tracked in UI-C02.";
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated ${records.length} SVG brand assets and updated ${manifestPath}`);
