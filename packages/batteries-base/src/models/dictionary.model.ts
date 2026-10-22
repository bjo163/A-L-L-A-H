import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class DictionaryModel extends BatteriesModel {
  /** @deprecated Legacy role vocabulary only. UNILEX is the canonical concept dictionary. */
  static override tableName = "dictionaries";

  static override fields: Record<string, FieldDefinition> = {
    code: { type: "string", required: true, unique: true },
    term: { type: "string", required: true },
    revelationOrigin: { type: "string", required: true }, // Legacy unreviewed role field; not source provenance
    frequencyDomain: { type: "string", required: true }, // Legacy project field; not canonical concept domain
    esotericDefinition: { type: "text", required: true }, // Legacy field; not a reviewed theological definition
    category: { type: "string", defaultTo: "role" },
  };

  code!: string;
  term!: string;
  revelationOrigin!: string;
  frequencyDomain!: string;
  esotericDefinition!: string;
  category!: string;
}
