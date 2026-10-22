const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const batteriesDna = deepFreeze({
  "schemaVersion": "1.0.0",
  "id": "dna-aliyy",
  "packageName": "@empire/batteries-dna-aliyy",
  "number": 36,
  "recordType": "reference_only",
  "lexicon": {
    "registry": "BATTERIES_BASE_LEXICON_SEED",
    "sourcePath": "packages/batteries-base/src/data/asmaul-husna.ts",
    "code": "aliyy",
    "sourceLanguage": "ar",
    "arabic": "الْعَلِيُّ",
    "transliteration": "Al-Aliyy",
    "canonicalLanguage": "en",
    "label": "Exaltedness",
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
