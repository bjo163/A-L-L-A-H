const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

/** Compose and integrity-check the metadata components listed by a fusion recipe. */
export function composeDnaFusion({ recipe, catalog, manifests }) {
  if (
    recipe.id !== "batteries-dna-fusion" ||
    recipe.status !== "DRAFT_REVIEW" ||
    recipe.loadMode !== "metadata_preload"
  ) {
    throw new Error("Fusion recipe identity, review status, or load mode is not supported.");
  }
  if (recipe.registryId !== catalog.registryId) {
    throw new Error("Fusion recipe and DNA catalog registry IDs do not match.");
  }
  if (recipe.executionEnabled !== false || recipe.authorityGranted !== false) {
    throw new Error("DNA fusion metadata cannot enable execution or grant authority.");
  }
  if (recipe.components.length !== catalog.packages.length || manifests.length !== catalog.packages.length) {
    throw new Error("Fusion recipe, catalog, and package manifests must have identical component counts.");
  }

  const catalogById = new Map(catalog.packages.map((item) => [item.id, item]));
  const manifestById = new Map(manifests.map((manifest) => [manifest.id, manifest]));
  if (catalogById.size !== catalog.packages.length) throw new Error("Duplicate DNA package IDs in catalog.");
  if (manifestById.size !== manifests.length) throw new Error("Duplicate DNA package manifest IDs.");

  const ids = new Set();
  const components = recipe.components.map((component) => {
    if (ids.has(component.id)) throw new Error(`Duplicate DNA component in fusion recipe: ${component.id}`);
    ids.add(component.id);
    if (component.required !== true) throw new Error(`DNA fusion component must be required: ${component.id}`);

    const catalogItem = catalogById.get(component.id);
    const manifest = manifestById.get(component.id);
    if (
      !catalogItem ||
      !manifest ||
      catalogItem.name !== component.packageName ||
      catalogItem.recordType !== component.recordType ||
      manifest.packageName !== component.packageName ||
      manifest.recordType !== component.recordType ||
      manifest.lexicon.code !== catalogItem.lexiconCode ||
      manifest.status !== "DRAFT_REVIEW" ||
      manifest.runtimeEnabled !== false ||
      manifest.authorityGranted !== false ||
      manifest.permissions.length !== 0 ||
      manifest.dependencies.length !== 0
    ) {
      throw new Error(`DNA fusion component failed catalog or manifest integrity checks: ${component.id}`);
    }

    if (component.recordType === "reference_only" && manifest.projectMapping !== null) {
      throw new Error(`Reference-only DNA component cannot have a project mapping: ${component.id}`);
    }
    if (component.recordType === "bounded_project_mapping" && !manifest.projectMapping) {
      throw new Error(`Bounded DNA component must have its declared draft project mapping: ${component.id}`);
    }

    return { ...manifest, preloadState: "preloaded" };
  });

  if (ids.size !== catalog.packages.length) {
    throw new Error(`Batteries DNA fusion loaded ${ids.size} of ${catalog.packages.length} catalog components.`);
  }

  return deepFreeze({
    recipe,
    preload: {
      state: "complete",
      expectedCount: recipe.components.length,
      loadedCount: components.length,
      mode: "metadata_preload",
    },
    components,
  });
}
