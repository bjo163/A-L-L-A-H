const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const batteriesDna = deepFreeze({
  "schemaVersion": "1.0.0",
  "id": "dna-sami",
  "packageName": "@empire/batteries-dna-sami",
  "number": 26,
  "recordType": "bounded_project_mapping",
  "lexicon": {
    "registry": "BATTERIES_BASE_LEXICON_SEED",
    "sourcePath": "packages/batteries-base/src/data/asmaul-husna.ts",
    "code": "sami",
    "sourceLanguage": "ar",
    "arabic": "السَّمِيعُ",
    "transliteration": "As-Sami",
    "canonicalLanguage": "en",
    "label": "Hearing",
    "domain": "Events",
    "editorialStatus": "DRAFT_REVIEW"
  },
  "projectMapping": {
    "relation": "inspiredBy",
    "attribute": "EventProcessing",
    "capability": "event-processing-sami",
    "scope": "Only event-processing-sami within events; work is limited to configured, connected, authorized system inputs and the package's stated technical behavior.",
    "description": "Draft project analogy for proposed capability event-processing-sami in events: software receives only events sent to its services.",
    "limitations": [
      "This is a project analogy inspiredBy a lexicon record, not a theological definition or equivalent.",
      "The package has no independent authority, user permissions, or divine capability.",
      "Draft project analogy for proposed capability event-processing-sami in events: software receives only events sent to its services."
    ]
  },
  "status": "DRAFT_REVIEW",
  "runtimeEnabled": false,
  "authorityGranted": false,
  "permissions": [],
  "dependencies": []
});
export default batteriesDna;
