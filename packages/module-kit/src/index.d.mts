
export interface ModuleManifest {
  id:string; title:string; version:string; owner:string; state:"bootstrap_ready"|"scaffold_only"|"ready"|"deprecated";
  dependencies:string[];capabilities:string[];permissions:string[];models:string[];upgrades:string[];uiSlots:string[];
  runMode:"first_party_allowlisted";
}
export function validateManifest(input:ModuleManifest):ModuleManifest;
export function resolveModules(manifests:ModuleManifest[]):readonly ModuleManifest[];
export function planEnabled(manifests:ModuleManifest[],requested:string[]):readonly ModuleManifest[];
