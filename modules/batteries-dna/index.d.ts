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
  capability: string | null;
  recordType: "bounded_project_mapping" | "reference_only";
  relation: "inspiredBy" | null;
  scope: string;
  limitations: readonly string[];
  status: string;
  authorityGranted: boolean;
  runtimeEnabled: boolean;
}

export declare const batteriesDnaCatalog: {
  schemaVersion: string;
  registryId: string;
  records: readonly BatteriesDnaCatalogItem[];
};

export declare function listBatteriesDna(): readonly BatteriesDnaCatalogItem[];
export declare function getBatteriesDna(key: string): BatteriesDnaCatalogItem | undefined;

export default batteriesDnaCatalog;
