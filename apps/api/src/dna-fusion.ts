import { readFile } from "node:fs/promises";
import { composeDnaFusion } from "@empire/batteries-dna-fusion";
import type { DnaCatalog, DnaFusionRecipe, DnaManifest } from "@empire/batteries-dna-fusion";

async function readJson<T>(url: URL): Promise<T> {
  return JSON.parse(await readFile(url, "utf8")) as T;
}

async function preloadFusion() {
  const [recipe, catalog] = await Promise.all([
    readJson<DnaFusionRecipe>(new URL("../../../config/batteries-dna-fusion.json", import.meta.url)),
    readJson<DnaCatalog>(new URL("../../../modules/batteries-dna/catalog.json", import.meta.url)),
  ]);

  const manifests = await Promise.all(recipe.components.map((component) => {
    const packageFolder = component.packageName.replace(/^@empire\//, "");
    return readJson<DnaManifest>(new URL(`../../../packages/${packageFolder}/manifest.json`, import.meta.url));
  }));

  return composeDnaFusion({ recipe, catalog, manifests });
}

let fusionPromise: ReturnType<typeof preloadFusion> | undefined;

export function loadDnaFusion() {
  fusionPromise ??= preloadFusion();
  return fusionPromise;
}
