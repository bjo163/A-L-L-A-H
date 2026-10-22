const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const batteriesDna = deepFreeze({
  "schemaVersion": "1.0.0",
  "id": "dna-maajid",
  "packageName": "@empire/batteries-dna-maajid",
  "number": 65,
  "recordType": "reference_only",
  "lexicon": {
    "registry": "BATTERIES_BASE_LEXICON_SEED",
    "sourcePath": "packages/batteries-base/src/data/asmaul-husna.ts",
    "code": "majid2",
    "sourceLanguage": "ar",
    "arabic": "الْمَاجِدُ",
    "transliteration": "Al-Maajid",
    "canonicalLanguage": "en",
    "label": "Nobility",
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
