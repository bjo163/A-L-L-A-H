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
const smallMasterPath = "assets/source/brand/orbit-small.svg";
const smallMaster = await readFile(resolve(root, smallMasterPath), "utf8");
const smallRootMatch = smallMaster.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
if (!smallRootMatch) throw new Error(`Invalid SVG optical source: ${smallMasterPath}`);
const smallViewBox = smallRootMatch[1].match(/\bviewBox="([^"]+)"/i)?.[1];
if (smallViewBox !== viewBox) throw new Error(`Optical source must share the master viewBox ${viewBox}; received ${smallViewBox ?? "none"}`);
const smallMarkup = smallRootMatch[2].trim();
const toJsx = (source) => source.replace(/\b(stroke|stroke-width|stroke-linecap|stroke-linejoin|fill-rule|clip-rule|clip-path|color-interpolation-filters)=/g, (_, name) => `${name.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())}=`);
const component = `/** Generated from ${masterPath}. Do not edit by hand. */\nexport function OrbitMark({ className }: { className?: string } = {}) {\n  return <svg aria-hidden="true" className={className} focusable="false" viewBox="${viewBox}" fill="none">${toJsx(markup)}</svg>;\n}\n`;
const smallComponent = `/** Generated from ${smallMasterPath}. Do not edit by hand. */\nexport function OrbitMarkSmall({ className }: { className?: string } = {}) {\n  return <svg aria-hidden="true" className={className} focusable="false" viewBox="${smallViewBox}" fill="none">${toJsx(smallMarkup)}</svg>;\n}\n`;
const brandVariants = {
  fullBrand: { color: "#f1b84b", label: "Empire of the Light full-brand mark" },
  monochrome: { color: "#201832", label: "Empire of the Light monochrome mark" },
  inverse: { color: "#ffffff", label: "Empire of the Light inverse mark" },
};
const svg = (size, variant, label = variant.label) => {
  const standaloneMarkup = markup.replaceAll("currentColor", variant.color).replace(/\s+/g, " ").trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" role="img" aria-label="${label}"><title>${label}</title>${standaloneMarkup}</svg>\n`;
};
const smallSvg = (size, label = "Empire of the Light") => {
  const standaloneMarkup = smallMarkup.replaceAll("currentColor", brandVariants.fullBrand.color).replace(/\s+/g, " ").trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${smallViewBox}" width="${size}" height="${size}" role="img" aria-label="${label}"><title>${label}</title>${standaloneMarkup}</svg>\n`;
};
const fullBrandSvg = svg(72, brandVariants.fullBrand, "Empire of the Light");
const monochromeSvg = svg(72, brandVariants.monochrome, "Empire of the Light");
const inverseSvg = svg(72, brandVariants.inverse, "Empire of the Light");
const small16Svg = smallSvg(16);
const small24Svg = smallSvg(24);
const faviconSvg = smallSvg(32);
const assetModule = `/** Generated from ${masterPath} and ${smallMasterPath}. Do not edit by hand. */\nexport const empireFaviconSvg = ${JSON.stringify(faviconSvg)};\nexport const empireMarkFullBrandSvg = ${JSON.stringify(fullBrandSvg)};\nexport const empireMarkMonochromeSvg = ${JSON.stringify(monochromeSvg)};\nexport const empireMarkInverseSvg = ${JSON.stringify(inverseSvg)};\nexport const empireMarkSmall16Svg = ${JSON.stringify(small16Svg)};\nexport const empireMarkSmall24Svg = ${JSON.stringify(small24Svg)};\nexport const empireMarkSmall32Svg = empireFaviconSvg;\n`;
const generated = [
  ["src/brand/OrbitMark.generated.tsx", component],
  ["src/brand/OrbitMarkSmall.generated.tsx", smallComponent],
  ["src/brand/BrandAssets.generated.ts", assetModule],
  ["assets/generated/brand/empire-mark.svg", fullBrandSvg],
  ["assets/generated/brand/empire-mark-monochrome.svg", monochromeSvg],
  ["assets/generated/brand/empire-mark-inverse.svg", inverseSvg],
  ["assets/generated/brand/empire-mark-small-16.svg", small16Svg],
  ["assets/generated/brand/empire-mark-small-24.svg", small24Svg],
  ["assets/generated/icons/favicon.svg", faviconSvg],
  ["assets/generated/icons/app-icon-48.svg", svg(48, brandVariants.fullBrand, "Empire of the Light")],
  ["assets/generated/icons/app-icon-192.svg", svg(192, brandVariants.fullBrand, "Empire of the Light")],
  ["assets/generated/icons/app-icon-512.svg", svg(512, brandVariants.fullBrand, "Empire of the Light")],
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
  opticalMaster: {
    source: smallMasterPath,
    componentOutput: "src/brand/OrbitMarkSmall.generated.tsx",
    sizes: [
      { size: 16, path: "assets/generated/brand/empire-mark-small-16.svg" },
      { size: 24, path: "assets/generated/brand/empire-mark-small-24.svg" },
      { size: 32, path: "assets/generated/icons/favicon.svg" },
    ],
  },
  variants: Object.fromEntries(Object.entries(brandVariants).map(([name, variant]) => [name, {
    path: name === "fullBrand"
      ? "assets/generated/brand/empire-mark.svg"
      : `assets/generated/brand/empire-mark-${name}.svg`,
    color: variant.color,
  }])),
  assetOutputs: records.filter(({ path }) => path.startsWith(`${manifest.generatedAssetDirectory}/`)).map(({ path }) => path),
};
manifest.generatedAssetPolicy = `Brand concepts are authored as inline SVG components; ${masterPath} is the single editable standard-size Orbit geometry source, with ${smallMasterPath} as its package-owned small-size optical correction. Both sources generate the LogoMark components, full-brand/monochrome/inverse variants, and favicon/app-icon SVGs. Outputs are deterministic and regenerated with pnpm --filter @empire/ui assets:generate. Final identity approval is tracked in UI-C02.`;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated ${records.length} manifest-tracked assets from ${masterPath} and ${smallMasterPath}`);
