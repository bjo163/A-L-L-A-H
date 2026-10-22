import { readFile } from "node:fs/promises";
import { resolveModules, planEnabled } from "@empire/module-kit";
import type { ModuleManifest } from "@empire/module-kit";
import { loadDnaFusion } from "./dna-fusion.js";

const moduleIds = ["kernel", "research", "scripture", "journey", "mission", "governance", "ziil"];

async function readJson<T>(url: URL): Promise<T> {
  return JSON.parse(await readFile(url, "utf8")) as T;
}

async function createModulePlan() {
  const [manifests, activation, dnaFusion] = await Promise.all([
    Promise.all(moduleIds.map((id) => readJson<ModuleManifest>(new URL(`../../../modules/${id}/manifest.json`, import.meta.url)))),
    readJson<{ approvedEnabled: string[] }>(new URL("../../../config/modules.json", import.meta.url)),
    loadDnaFusion(),
  ]);
  return {
    catalog: resolveModules(manifests),
    enabled: planEnabled(manifests, activation.approvedEnabled),
    dnaFusion,
  };
}

let modulePlanPromise: ReturnType<typeof createModulePlan> | undefined;

export function loadModulePlan() {
  modulePlanPromise ??= createModulePlan();
  return modulePlanPromise;
}
