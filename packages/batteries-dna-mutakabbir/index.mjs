const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const batteriesDna = deepFreeze({
  "schemaVersion": "1.0.0",
  "id": "dna-mutakabbir",
  "packageName": "@empire/batteries-dna-mutakabbir",
  "number": 10,
  "recordType": "reference_only",
  "lexicon": {
    "registry": "BATTERIES_BASE_LEXICON_SEED",
    "sourcePath": "packages/batteries-base/src/data/asmaul-husna.ts",
    "code": "mutakabbir",
    "sourceLanguage": "ar",
    "arabic": "الْمُتَكَبِّرُ",
    "transliteration": "Al-Mutakabbir",
    "canonicalLanguage": "en",
    "label": "Grandeur",
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
