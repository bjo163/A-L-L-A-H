const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const batteriesDna = deepFreeze({
  "schemaVersion": "1.0.0",
  "id": "dna-mutaali",
  "packageName": "@empire/batteries-dna-mutaali",
  "number": 78,
  "recordType": "reference_only",
  "lexicon": {
    "registry": "BATTERIES_BASE_LEXICON_SEED",
    "sourcePath": "packages/batteries-base/src/data/asmaul-husna.ts",
    "code": "mutaali",
    "sourceLanguage": "ar",
    "arabic": "الْمُتَعَالِي",
    "transliteration": "Al-Muta'ali",
    "canonicalLanguage": "en",
    "label": "Transcendence",
    "domain": "Theology",
    "editorialStatus": "DRAFT_REVIEW"
  },
  "projectMapping": null,
  "status": "DRAFT_REVIEW",
  "runtimeEnabled": false,
  "authorityGranted": false,
  "permissions": [],
  "dependencies": []
});
export default batteriesDna;
