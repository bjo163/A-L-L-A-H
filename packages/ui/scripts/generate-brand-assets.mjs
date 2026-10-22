import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "assets/asset-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const masterPath = "assets/source/brand/orbit.svg";
const master = await readFile(resolve(root, masterPath), "utf8");
const rootMatch = master.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
if (!rootMatch) throw new Error(`Invalid SVG master: ${masterPath}`);
const viewBox = rootMatch[1].match(/\bviewBox="([^"]+)"/i)?.[1];
if (viewBox !== "0 0 72 72") throw new Error(`Orbit master must use viewBox 0 0 72 72; received ${viewBox ?? "none"}`);
const markup = rootMatch[2].trim();
const jsx = markup.replace(/\b(stroke|stroke-width|stroke-linecap|stroke-linejoin|fill-rule|clip-rule|clip-path|color-interpolation-filters)=/g, (_, name) => `${name.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())}=`);
const component = `import type { SVGProps } from "react";\n\n/** Generated from assets/source/brand/orbit.svg. Do not edit by hand. */\nexport function OrbitMark(props: SVGProps<SVGSVGElement>) {\n  return <svg aria-hidden="true" focusable="false" viewBox="${viewBox}" fill="none" {...props}>${jsx}</svg>;\n}\n`;
const brandColor = "#f1b84b";
const standaloneMarkup = markup.replaceAll("currentColor", brandColor).replace(/\s+/g, " ").trim();
const svg = (size, label = "Empire of the Light") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" role="img" aria-label="${label}"><title>${label}</title>${standaloneMarkup}</svg>\n`;
const faviconSvg = svg(32);
const assetModule = `/** Generated from assets/source/brand/orbit.svg. Do not edit by hand. */\nexport const empireFaviconSvg = ${JSON.stringify(faviconSvg)};\n`;
const generated = [
  ["src/brand/OrbitMark.generated.tsx", component],
  ["src/brand/BrandAssets.generated.ts", assetModule],
  ["assets/generated/brand/empire-mark.svg", svg(72)],
  ["assets/generated/icons/favicon.svg", faviconSvg],
  ["assets/generated/icons/app-icon-48.svg", svg(48)],
  ["assets/generated/icons/app-icon-192.svg", svg(192)],
  ["assets/generated/icons/app-icon-512.svg", svg(512)],
];
const records = [];
for (const [relativePath, contents] of generated) {
  const destination = resolve(root, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents, "utf8");
  records.push({ path: relativePath, sha256: createHash("sha256").update(contents).digest("hex") });
}
manifest.generatedFiles = records;
manifest.vectors.brandMaster = {
  concept: "orbit",
  source: masterPath,
  componentOutput: "src/brand/OrbitMark.generated.tsx",
  assetModuleOutput: "src/brand/BrandAssets.generated.ts",
  assetOutputs: records.filter(({ path }) => path.startsWith(`${manifest.generatedAssetDirectory}/`)).map(({ path }) => path),
};
manifest.generatedAssetPolicy = `Brand concepts are authored as inline SVG components; ${masterPath} is the single editable Orbit geometry source for the generated LogoMark React component and mark/favicon/app-icon SVGs. Outputs are deterministic and regenerated with pnpm --filter @empire/ui assets:generate. Final identity approval is tracked in UI-C02.`;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated ${records.length} manifest-tracked assets from ${masterPath}`);
