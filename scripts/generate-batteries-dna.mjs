import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, readdirSync, unlinkSync, rmdirSync } from "node:fs";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "packages/batteries-base/src/data/asmaul-husna.ts");
const source = readFileSync(sourcePath, "utf8");
const entries = [...source.matchAll(/^\s*\{ number: (\d+), code: "([^"]+)", arabic: "([^"]+)", translit: "([^"]+)", term: "([^"]+)", attribute: "([^"]+)", domain: "([^"]+)", wisdom: "([^"]+)" \},?$/gm)]
  .map(([, number, code, arabic, transliteration, label, attribute, domain, wisdom]) => ({ number: Number(number), code, arabic, transliteration, label, attribute, domain, wisdom }));

if (entries.length !== 99 || entries.some((entry, index) => entry.number !== index + 1)) {
  throw new Error(`Expected 99 sequential Asma lexicon records; found ${entries.length}`);
}

const humanize = (value) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2").replace(/([_-])/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
const packageSlugOverrides = {
  bashir: "basir", mushawwir: "musawwir", khafidh: "khafid", mudzill: "mudhill", lathif: "latif",
  azhim: "azim", syakur: "shakur", hafizh: "hafiz", baits: "baith", syahid: "shahid",
  muhshi: "muhsi", majid2: "maajid", zhahir: "zahir", malik_mulk: "malik-al-mulk",
  dzul_jalal: "dhu-al-jalal-wa-l-ikram", dharr: "darr", warits: "warith", rasyid: "rashid"
};
const packageSlug = (code) => packageSlugOverrides[code] ?? code.replace(/_/g, "-");
const referenceOnlyCodes = new Set(["mutakabbir", "aliyy", "majid", "majid2", "ahad", "mutaali", "dzul_jalal", "malik_mulk"]);
const capabilityOverrides = {
  razzaq: "compute-resource-provisioning",
  karim: "policy-based-resource-allocation",
  azhim: "storage-capacity-planning",
  kabir: "infrastructure-capacity-planning",
  mughni: "capacity-improvement-planning",
  syakur: "gratitude-capture",
  hamid: "contribution-recognition",
  wasi: "service-capacity-boundary-reporting",
  muqtadir: "infrastructure-capacity-constraint-evaluation",
  hakim: "heuristic-decision-support",
  rasyid: "decision-rationale-presentation",
  matin: "availability-signal-monitoring",
  hayy: "health-check-reporting",
  samad: "technical-dependency-inventory",
  ghaniyy: "external-dependency-health-monitoring",
  awwal: "service-initialization",
  akhir: "service-retirement-workflow"
};
const capabilityFor = (entry) => {
  if (referenceOnlyCodes.has(entry.code)) return null;
  if (capabilityOverrides[entry.code]) return capabilityOverrides[entry.code];
  const words = entry.attribute.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return `${words}-${packageSlug(entry.code)}`;
};
const packages = entries.map((entry) => {
  const slug = packageSlug(entry.code);
  const isReferenceOnly = referenceOnlyCodes.has(entry.code);
  const wisdom = entry.wisdom.replace(/^Project analogy:\s*/i, "").replace(/^Islamic theological name;\s*/i, "").replace(/^Theological term;\s*/i, "").replace(/^Theological reference only;\s*/i, "");
  const capability = capabilityFor(entry);
  const bounded = isReferenceOnly
    ? "Lexicon reference only; no software capability or authority is assigned."
    : `Draft project analogy for proposed capability ${capability} in ${humanize(entry.domain)}: ${wisdom}`;
  return {
    ...entry,
    name: `@empire/batteries-dna-${slug}`,
    id: `dna-${slug}`,
    lexiconCode: entry.code,
    transliteration: entry.transliteration,
    mapping: isReferenceOnly ? null : bounded,
    capability,
    recordType: isReferenceOnly ? "reference_only" : "bounded_project_mapping",
    relation: isReferenceOnly ? null : "inspiredBy",
    scope: isReferenceOnly ? "Lexicon reference only; no software function is assigned." : `Only ${capability} within ${humanize(entry.domain)}; work is limited to configured, connected, authorized system inputs and the package's stated technical behavior.`,
    limitations: [
      isReferenceOnly ? "Lexicon reference only; it is not a software capability." : "This is a project analogy inspiredBy a lexicon record, not a theological definition or equivalent.",
      "The package has no independent authority, user permissions, or divine capability.",
      ...(isReferenceOnly ? [] : [bounded])
    ],
    status: "DRAFT_REVIEW",
    authorityGranted: false,
    runtimeEnabled: false
  };
});

const packagesRoot = resolve(root, "packages");
const legacyPackagesRoot = resolve(root, "modules/batteries-dna/packages");
for (const item of packages) {
  const folderName = item.name.replace(/^@empire\//, "");
  const oldPath = resolve(legacyPackagesRoot, item.id);
  const newPath = resolve(packagesRoot, folderName);
  for (const [basePath, candidatePath] of [[legacyPackagesRoot, oldPath], [packagesRoot, newPath]]) {
    const relativePath = relative(basePath, candidatePath);
    if (relativePath.startsWith(`..${sep}`) || relativePath === ".." || resolve(basePath, relativePath) !== candidatePath) {
      throw new Error(`Refusing to touch package path outside its expected workspace directory: ${candidatePath}`);
    }
  }
  const verifyGeneratedPackage = (packagePath) => {
    const generatedFiles = readdirSync(packagePath).sort();
    if (generatedFiles.join(",") !== "index.mjs,manifest.json,package.json") {
      throw new Error(`Refusing to move or overwrite unexpected files in package directory ${packagePath}`);
    }
    const metadata = JSON.parse(readFileSync(resolve(packagePath, "package.json"), "utf8"));
    const manifest = JSON.parse(readFileSync(resolve(packagePath, "manifest.json"), "utf8"));
    if (metadata.name !== item.name || metadata.private !== true || manifest.lexicon?.code !== item.lexiconCode) {
      throw new Error(`Refusing to move or overwrite ${packagePath}; package metadata does not match the generated ${item.name}.`);
    }
  };
  if (!existsSync(oldPath)) continue;
  verifyGeneratedPackage(oldPath);
  if (!existsSync(newPath)) {
    renameSync(oldPath, newPath);
  } else {
    verifyGeneratedPackage(newPath);
    for (const filename of readdirSync(oldPath)) unlinkSync(resolve(oldPath, filename));
    rmdirSync(oldPath);
  }
}
if (existsSync(legacyPackagesRoot)) {
  const remainingLegacyEntries = readdirSync(legacyPackagesRoot);
  if (remainingLegacyEntries.length > 0) throw new Error(`Unexpected files remain in legacy package directory: ${remainingLegacyEntries.join(", ")}`);
  rmdirSync(legacyPackagesRoot);
}

const catalogPath = resolve(root, "modules/batteries-dna/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
catalog.source.listBasis = "A commonly circulated at-Tirmidhi enumeration used as a seed; it is not presented as the hadith's own enumerated list or as the only scholarly compilation.";
catalog.source.references = [
  { title: "Sahih al-Bukhari 2736", url: "https://sunnah.com/bukhari:2736", use: "The hadith about ninety-nine names; it does not enumerate this catalog." },
  { title: "Jami at-Tirmidhi 3507", url: "https://sunnah.com/tirmidhi:3507", use: "A commonly circulated enumeration; included as list-basis context, not a final editorial authority." },
  { title: "Islamic Relief UK, 99 Names of Allah", url: "https://www.islamic-relief.org.uk/resources/knowledge-base/99-names-of-allah/", use: "Scholar-reviewed comparison for Arabic forms and transliteration." },
  { title: "OpenArabic, 99 Names of Allah With Meanings and Roots", url: "https://openarabic.org/99-names-of-allah/", use: "Comparison of Arabic forms, list history, and transliteration variants." }
];
catalog.packages = packages;
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

const fusionRecipe = {
  schemaVersion: "1.0.0",
  id: "batteries-dna-fusion",
  name: "Batteries DNA Unified Fusion",
  version: "0.1.0",
  status: "DRAFT_REVIEW",
  loadMode: "metadata_preload",
  registryId: catalog.registryId,
  description: "Preloads all 99 first-party DNA package manifests into the main API process as metadata. It does not execute proposed capabilities or grant authority.",
  executionEnabled: false,
  authorityGranted: false,
  components: packages.map((item) => ({
    id: item.id,
    packageName: item.name,
    recordType: item.recordType,
    required: true
  }))
};
const fusionPath = resolve(root, "config/batteries-dna-fusion.json");
writeFileSync(fusionPath, `${JSON.stringify(fusionRecipe, null, 2)}\n`);

for (const item of packages) {
  const folder = resolve(packagesRoot, item.name.replace(/^@empire\//, ""));
  mkdirSync(folder, { recursive: true });
  const packageJson = {
    name: item.name,
    version: "0.1.0",
    private: true,
    type: "module",
    description: `Draft Batteries DNA ${item.recordType.replaceAll("_", " ")} for ${item.transliteration} (${item.label}); lexicon source ${item.lexiconCode}.`,
    exports: { ".": "./index.mjs", "./manifest": "./manifest.json" },
    files: ["index.mjs", "manifest.json"]
  };
  const manifest = {
    schemaVersion: "1.0.0",
    id: item.id,
    packageName: item.name,
    number: item.number,
    recordType: item.recordType,
    lexicon: {
      registry: "BATTERIES_BASE_LEXICON_SEED",
      sourcePath: "packages/batteries-base/src/data/asmaul-husna.ts",
      code: item.lexiconCode,
      sourceLanguage: "ar",
      arabic: item.arabic,
      transliteration: item.transliteration,
      canonicalLanguage: "en",
      label: item.label,
      domain: item.domain,
      editorialStatus: "DRAFT_REVIEW"
    },
    projectMapping: item.recordType === "reference_only" ? null : {
      relation: item.relation,
      attribute: item.attribute,
      capability: item.capability,
      scope: item.scope,
      description: item.mapping,
      limitations: item.limitations
    },
    status: "DRAFT_REVIEW",
    runtimeEnabled: false,
    authorityGranted: false,
    permissions: [],
    dependencies: []
  };
  writeFileSync(resolve(folder, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
  writeFileSync(resolve(folder, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(resolve(folder, "index.mjs"), `const deepFreeze = (value) => {\n  if (value && typeof value === "object" && !Object.isFrozen(value)) {\n    Object.values(value).forEach(deepFreeze);\n    Object.freeze(value);\n  }\n  return value;\n};\n\nexport const batteriesDna = deepFreeze(${JSON.stringify(manifest, null, 2)});\nexport default batteriesDna;\n`);
}

console.log(`Generated ${packages.length} Batteries DNA packages from ${sourcePath}`);
