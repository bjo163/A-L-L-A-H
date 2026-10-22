import catalog from "./catalog.json" with { type: "json" };

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

const records = deepFreeze(catalog.packages);
deepFreeze(catalog);

export const batteriesDnaCatalog = catalog;
export const listBatteriesDna = () => records;
export const getBatteriesDna = (key) => records.find((item) => item.code === key || item.lexiconCode === key || item.id === key || item.id === `dna-${key}` || item.name === key);
export default batteriesDnaCatalog;
