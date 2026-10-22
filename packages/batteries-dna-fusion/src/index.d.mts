export type DnaRecordType = "bounded_project_mapping" | "reference_only";

export interface DnaManifest {
  schemaVersion: "1.0.0";
  id: string;
  packageName: string;
  number: number;
  recordType: DnaRecordType;
  lexicon: {
    code: string;
    arabic: string;
    transliteration: string;
    canonicalLanguage: "en";
    label: string;
    domain: string;
    editorialStatus: "DRAFT_REVIEW";
  };
  projectMapping: null | {
    relation: "inspiredBy";
    capability: string;
    scope: string;
    description: string;
    limitations: string[];
  };
  status: "DRAFT_REVIEW";
  runtimeEnabled: false;
  authorityGranted: false;
  permissions: string[];
  dependencies: string[];
}

export interface DnaFusionRecipe {
  schemaVersion: "1.0.0";
  id: "batteries-dna-fusion";
  name: string;
  version: string;
  status: "DRAFT_REVIEW";
  loadMode: "metadata_preload";
  registryId: string;
  description: string;
  executionEnabled: false;
  authorityGranted: false;
  components: Array<{
    id: string;
    packageName: string;
    recordType: DnaRecordType;
    required: true;
  }>;
}

export interface DnaCatalog {
  registryId: string;
  packages: Array<{
    id: string;
    name: string;
    lexiconCode: string;
    recordType: DnaRecordType;
  }>;
}

export interface DnaFusionPlan {
  recipe: DnaFusionRecipe;
  preload: {
    state: "complete";
    expectedCount: number;
    loadedCount: number;
    mode: "metadata_preload";
  };
  components: ReadonlyArray<DnaManifest & { preloadState: "preloaded" }>;
}

export function composeDnaFusion(input: {
  recipe: DnaFusionRecipe;
  catalog: DnaCatalog;
  manifests: DnaManifest[];
}): DnaFusionPlan;
