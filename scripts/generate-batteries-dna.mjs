import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, rmdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { capabilityFor, humanizeDomain, isReferenceOnly, parseAsmaEntries, slugForCode } from "./lib/batteries-dna-catalog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "packages/batteries-base/src/data/asmaul-husna.ts");
const source = readFileSync(sourcePath, "utf8");
const entries = parseAsmaEntries(source);

if (entries.length !== 99 || entries.some((entry, index) => entry.number !== index + 1)) {
  throw new Error(`Expected 99 sequential Asma lexicon records; found ${entries.length}`);
}

const packages = entries.map((entry) => {
  const slug = slugForCode(entry.code);
  const referenceOnly = isReferenceOnly(entry.code);
  const wisdom = entry.wisdom.replace(/^Project analogy:\s*/i, "").replace(/^Islamic theological name;\s*/i, "").replace(/^Theological term;\s*/i, "").replace(/^Theological reference only;\s*/i, "");
  const capability = capabilityFor(entry);
  const bounded = referenceOnly
    ? "Lexicon reference only; no software capability or authority is assigned."
    : `Draft project analogy for proposed capability ${capability} in ${humanizeDomain(entry.domain)}: ${wisdom}`;
  return {
    ...entry,
    slug,
    id: `dna-${slug}`,
    lexiconCode: entry.code,
    transliteration: entry.transliteration,
    mapping: referenceOnly ? null : bounded,
    capability,
    recordType: referenceOnly ? "reference_only" : "bounded_project_mapping",
    relation: referenceOnly ? null : "inspiredBy",
    scope: referenceOnly ? "Lexicon reference only; no software function is assigned." : `Only ${capability} within ${humanizeDomain(entry.domain)}; work is limited to configured, connected, authorized system inputs and the registry record's stated technical behavior.`,
    limitations: [
      referenceOnly ? "Lexicon reference only; it is not a software capability." : "This is a project analogy inspiredBy a lexicon record, not a theological definition or equivalent.",
      "The package has no independent authority, user permissions, or divine capability.",
      ...(referenceOnly ? [] : [bounded])
    ],
    status: "DRAFT_REVIEW",
    authorityGranted: false,
    runtimeEnabled: false
  };
});

const catalogPath = resolve(root, "modules/batteries-dna/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
catalog.source.listBasis = "A commonly circulated at-Tirmidhi enumeration used as a seed; it is not presented as the hadith's own enumerated list or as the only scholarly compilation.";
catalog.source.references = [
  { title: "Sahih al-Bukhari 2736", url: "https://sunnah.com/bukhari:2736", use: "The hadith about ninety-nine names; it does not enumerate this catalog." },
  { title: "Jami at-Tirmidhi 3507", url: "https://sunnah.com/tirmidhi:3507", use: "A commonly circulated enumeration; included as list-basis context, not a final editorial authority." },
  { title: "Islamic Relief UK, 99 Names of Allah", url: "https://www.islamic-relief.org.uk/resources/knowledge-base/99-names-of-allah/", use: "Scholar-reviewed comparison for Arabic forms and transliteration." },
  { title: "OpenArabic, 99 Names of Allah With Meanings and Roots", url: "https://openarabic.org/99-names-of-allah/", use: "Comparison of Arabic forms, list history, and transliteration variants." }
];
catalog.description = "A catalog of 99 source-linked records: 91 bounded draft project capability mappings and eight lexicon-reference-only entries. Arabic source forms preserve identity. Nothing here claims divine attributes for software.";
catalog.records = packages;
delete catalog.packages;
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

const packagesRoot = resolve(root, "packages");
const obsoletePackages = packages.map((item) => ({ item, path: resolve(packagesRoot, `batteries-dna-${item.slug}`) }));
for (const { item, path } of obsoletePackages) {
  if (!existsSync(path)) continue;
  const files = readdirSync(path).sort();
  if (files.join(",") !== "index.mjs,manifest.json,package.json") {
    throw new Error(`Refusing to remove unexpected files from legacy DNA package directory ${path}`);
  }
  const metadata = JSON.parse(readFileSync(resolve(path, "package.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(resolve(path, "manifest.json"), "utf8"));
  if (metadata.name !== `@empire/batteries-dna-${item.slug}` || metadata.private !== true || manifest.lexicon?.code !== item.lexiconCode) {
    throw new Error(`Refusing to remove ${path}; it does not match generated DNA record ${item.lexiconCode}.`);
  }
}
for (const { path } of obsoletePackages) {
  if (!existsSync(path)) continue;
  for (const filename of readdirSync(path)) unlinkSync(resolve(path, filename));
  rmdirSync(path);
}

console.log(`Generated ${packages.length} Batteries DNA registry records from ${sourcePath}; removed verified legacy package folders.`);
