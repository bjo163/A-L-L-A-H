import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { composeDnaFusion } from "../packages/batteries-dna-fusion/src/index.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const sourcePath = "packages/batteries-base/src/data/asmaul-husna.ts";
const source = readFileSync(resolve(root, sourcePath), "utf8");
const sourceEntries = [...source.matchAll(/^\s*\{ number: (\d+), code: "([^"]+)", arabic: "([^"]+)", translit: "([^"]+)", term: "([^"]+)", attribute: "([^"]+)", domain: "([^"]+)", wisdom: "([^"]+)" \},?$/gm)]
  .map(([, number, code, arabic, transliteration, label, attribute, domain]) => ({ number: Number(number), code, arabic, transliteration, label, attribute, domain }));
const slugOverrides = { bashir: "basir", mushawwir: "musawwir", khafidh: "khafid", mudzill: "mudhill", lathif: "latif", azhim: "azim", syakur: "shakur", hafizh: "hafiz", baits: "baith", syahid: "shahid", muhshi: "muhsi", majid2: "maajid", zhahir: "zahir", malik_mulk: "malik-al-mulk", dzul_jalal: "dhu-al-jalal-wa-l-ikram", dharr: "darr", warits: "warith", rasyid: "rashid" };
const referenceOnlyCodes = new Set(["mutakabbir", "aliyy", "majid", "majid2", "ahad", "mutaali", "dzul_jalal", "malik_mulk"]);
const capabilityOverrides = { razzaq: "compute-resource-provisioning", karim: "policy-based-resource-allocation", azhim: "storage-capacity-planning", kabir: "infrastructure-capacity-planning", mughni: "capacity-improvement-planning", syakur: "gratitude-capture", hamid: "contribution-recognition", wasi: "service-capacity-boundary-reporting", muqtadir: "infrastructure-capacity-constraint-evaluation", hakim: "heuristic-decision-support", rasyid: "decision-rationale-presentation", matin: "availability-signal-monitoring", hayy: "health-check-reporting", samad: "technical-dependency-inventory", ghaniyy: "external-dependency-health-monitoring", awwal: "service-initialization", akhir: "service-retirement-workflow" };
const slugFor = (code) => slugOverrides[code] ?? code.replace(/_/g, "-");
const capabilityFor = (entry) => {
  if (referenceOnlyCodes.has(entry.code)) return null;
  if (capabilityOverrides[entry.code]) return capabilityOverrides[entry.code];
  const words = entry.attribute.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  return `${words}-${slugFor(entry.code)}`;
};
const catalog = read("modules/batteries-dna/catalog.json");
const fusionRecipe = read("config/batteries-dna-fusion.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
const catalogSchema = read("schemas/batteries-dna-catalog.schema.json");
const manifestSchema = read("schemas/batteries-dna-manifest.schema.json");
const fusionSchema = read("schemas/batteries-dna-fusion.schema.json");
const validateCatalogSchema = ajv.compile(catalogSchema);
const validateManifestSchema = ajv.compile(manifestSchema);
const validateFusionSchema = ajv.compile(fusionSchema);
assert.equal(validateCatalogSchema(catalog), true, `catalog JSON Schema errors: ${JSON.stringify(validateCatalogSchema.errors)}`);
assert.equal(validateFusionSchema(fusionRecipe), true, `fusion recipe JSON Schema errors: ${JSON.stringify(validateFusionSchema.errors)}`);
const packageFolders = readdirSync(resolve(root, "packages"), { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith("batteries-dna-") && entry.name !== "batteries-dna-fusion");
const loadedManifests = [];
assert.equal(catalog.registryId, "BATTERIES_DNA_ASMA_99");
assert.equal(catalog.source.editorialStatus, "DRAFT_REVIEW");
assert.ok(catalog.source.references.length >= 3, "catalog must retain source references for list basis and comparison");
assert.match(catalog.source.listBasis, /not presented as the hadith's own enumerated list/i);
assert.equal(catalog.mappingRelation, "inspiredBy");
assert.equal(catalog.authorityGranted, false);
assert.equal(catalog.runtimeEnabled, false);
assert.deepEqual(catalog.locales, ["en"]);
assert.equal(sourceEntries.length, 99, "source lexicon must contain 99 parseable entries");
assert.equal(catalog.packages.length, 99, "catalog must contain all 99 package records");
assert.equal(fusionRecipe.registryId, catalog.registryId);
assert.equal(fusionRecipe.loadMode, "metadata_preload");
assert.equal(fusionRecipe.executionEnabled, false);
assert.equal(fusionRecipe.authorityGranted, false);
assert.equal(fusionRecipe.components.length, 99, "fusion recipe must preload all 99 DNA packages");
assert.deepEqual(fusionRecipe.components, catalog.packages.map((item) => ({ id: item.id, packageName: item.name, recordType: item.recordType, required: true })), "fusion recipe components must exactly match catalog package identity and order");
assert.equal(new Set(fusionRecipe.components.map((component) => component.id)).size, 99, "fusion recipe must not repeat DNA packages");
assert.equal(packageFolders.length, 99, "packages/ must contain exactly 99 visible Batteries DNA package folders");
assert.equal(new Set(catalog.packages.map((item) => item.name)).size, 99, "package names must be unique");
assert.equal(new Set(catalog.packages.map((item) => item.id)).size, 99, "package IDs must be unique");
assert.equal(new Set(catalog.packages.map((item) => item.code)).size, 99, "legacy codes must be unique");
assert.equal(new Set(catalog.packages.map((item) => item.lexiconCode)).size, 99, "lexicon codes must be unique");
const activeCapabilities = catalog.packages.map((item) => item.capability).filter(Boolean);
assert.equal(activeCapabilities.length, 91, "only the 91 bounded software mappings may claim a project capability");
assert.equal(new Set(activeCapabilities).size, activeCapabilities.length, "bounded project capabilities must be unique");
const invalidReferenceOnly = structuredClone(catalog.packages.find((item) => item.recordType === "reference_only"));
invalidReferenceOnly.capability = "forbidden-software-capability";
assert.equal(validateCatalogSchema({ ...catalog, packages: catalog.packages.map((item) => item.id === invalidReferenceOnly.id ? invalidReferenceOnly : item) }), false, "schema must reject a capability on a reference-only record");

const workspace = readFileSync(resolve(root, "pnpm-workspace.yaml"), "utf8");
assert.match(workspace, /packages\/\*/);
const schema = read("schemas/batteries-dna-catalog.schema.json");
assert.equal(schema.$defs.package.properties.status.const, "DRAFT_REVIEW");
assert.equal(schema.$defs.package.properties.authorityGranted.const, false);
assert.equal(schema.$defs.package.properties.runtimeEnabled.const, false);
const reviewedTransliterations = { mushawwir: "Al-Musawwir", bashir: "Al-Basir", khafidh: "Al-Khafid", mudzill: "Al-Mudhill", lathif: "Al-Latif", azhim: "Al-Azim", syakur: "Ash-Shakur", hafizh: "Al-Hafiz", baits: "Al-Ba'ith", syahid: "Ash-Shahid", muhshi: "Al-Muhsi", majid2: "Al-Maajid", samad: "As-Samad", zhahir: "Az-Zahir", malik_mulk: "Malik al-Mulk", dzul_jalal: "Dhu al-Jalal wa-l-Ikram", dharr: "Ad-Darr", warits: "Al-Warith", rasyid: "Ar-Rashid" };
for (const entry of sourceEntries) if (reviewedTransliterations[entry.code]) assert.equal(entry.transliteration, reviewedTransliterations[entry.code], `reviewed English transliteration mismatch for ${entry.code}`);
assert.equal(sourceEntries.find((entry) => entry.code === "malik_mulk")?.attribute, "TheologicalReference");
assert.equal(sourceEntries.find((entry) => entry.code === "malik_mulk")?.domain, "Theology");

for (let index = 0; index < 99; index += 1) {
  const expected = sourceEntries[index];
  const item = catalog.packages[index];
  const slug = slugFor(expected.code);
  const folder = `packages/batteries-dna-${slug}`;
  assert.equal(item.number, index + 1);
  assert.equal(item.name, `@empire/batteries-dna-${slug}`);
  assert.equal(item.id, `dna-${slug}`);
  assert.equal(item.lexiconCode, expected.code);
  assert.equal(item.arabic, expected.arabic);
  assert.equal(item.transliteration, expected.transliteration);
  assert.equal(item.label, expected.label);
  assert.equal(item.attribute, expected.attribute);
  assert.equal(item.domain, expected.domain);
  assert.equal(item.capability, capabilityFor(expected));
  assert.equal(item.recordType, referenceOnlyCodes.has(expected.code) ? "reference_only" : "bounded_project_mapping");
  if (item.recordType === "reference_only") {
    assert.equal(item.capability, null);
    assert.equal(item.relation, null);
    assert.equal(item.mapping, null);
  } else {
    assert.ok(item.capability);
    assert.equal(item.relation, "inspiredBy");
    assert.ok(item.mapping);
  }
  assert.equal(item.status, "DRAFT_REVIEW");
  assert.equal(item.authorityGranted, false);
  assert.equal(item.runtimeEnabled, false);
  assert.ok(item.limitations.length > 0);

  const packageJson = read(`${folder}/package.json`);
  const manifest = read(`${folder}/manifest.json`);
  loadedManifests.push(manifest);
  assert.equal(validateManifestSchema(manifest), true, `${folder}/manifest.json JSON Schema errors: ${JSON.stringify(validateManifestSchema.errors)}`);
  assert.equal(packageJson.name, item.name);
  assert.equal(packageJson.exports["."], "./index.mjs");
  assert.equal(manifest.id, item.id);
  assert.equal(manifest.packageName, item.name);
  assert.equal(manifest.recordType, item.recordType);
  assert.equal(manifest.lexicon.code, expected.code);
  assert.equal(manifest.lexicon.registry, "BATTERIES_BASE_LEXICON_SEED");
  assert.equal(manifest.lexicon.editorialStatus, "DRAFT_REVIEW");
  if (item.recordType === "reference_only") assert.equal(manifest.projectMapping, null);
  else {
    assert.equal(manifest.projectMapping.relation, "inspiredBy");
    assert.equal(manifest.projectMapping.capability, item.capability);
  }
  assert.equal(manifest.runtimeEnabled, false);
  assert.equal(manifest.authorityGranted, false);
  assert.deepEqual(manifest.permissions, []);
  assert.deepEqual(manifest.dependencies, []);
  const descriptor = (await import(`${pathToFileURL(resolve(root, folder, "index.mjs")).href}?validation=${index}`)).default;
  assert.deepEqual(descriptor, manifest);
}

const composedFusion = composeDnaFusion({ recipe: fusionRecipe, catalog, manifests: loadedManifests });
assert.equal(composedFusion.preload.state, "complete");
assert.equal(composedFusion.preload.expectedCount, 99);
assert.equal(composedFusion.preload.loadedCount, 99);
assert.ok(composedFusion.components.every((component) => component.preloadState === "preloaded"));
assert.ok(Object.isFrozen(composedFusion.components));

const registry = await import(`${pathToFileURL(resolve(root, "modules/batteries-dna/index.mjs")).href}?validation=1`);
assert.equal(registry.listBatteriesDna().length, 99);
assert.equal(registry.getBatteriesDna("basir")?.id, "dna-basir");
assert.equal(registry.getBatteriesDna("bashir")?.id, "dna-basir");
assert.equal(registry.getBatteriesDna("@empire/batteries-dna-muhaymin")?.lexiconCode, "muhaymin");
assert.equal(registry.getBatteriesDna("majid")?.name, "@empire/batteries-dna-majid");
assert.equal(registry.getBatteriesDna("majid2")?.name, "@empire/batteries-dna-maajid");
assert.equal(registry.getBatteriesDna("not-a-lexicon-code"), undefined);
assert.ok(Object.isFrozen(registry.getBatteriesDna("bashir")?.limitations));

console.log("PASS: 99 Batteries DNA workspace packages match the source lexicon and remain draft, non-runtime project mappings.");
