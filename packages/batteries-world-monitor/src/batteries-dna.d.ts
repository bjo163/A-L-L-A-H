declare module "@empire/batteries-dna" {
  export interface BatteriesDnaCatalogItem {
    number: number;
    code: string;
    arabic: string;
    transliteration: string;
    label: string;
    attribute: string;
    domain: string;
    wisdom: string;
    slug: string;
    id: string;
    lexiconCode: string;
    capability: string;
    recordType: string;
    relation: "inspiredBy" | null;
    scope: string;
    limitations: readonly string[];
    status: string;
    authorityGranted: boolean;
    runtimeEnabled: boolean;
  }

  export function listBatteriesDna(): readonly BatteriesDnaCatalogItem[];
  export function getBatteriesDna(key: string): BatteriesDnaCatalogItem | undefined;
  export const batteriesDnaCatalog: { records: readonly BatteriesDnaCatalogItem[] };
  export default batteriesDnaCatalog;
}
