import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class LexiconModel extends BatteriesModel {
  static override tableName = "lexicons";

  static override fields: Record<string, FieldDefinition> = {
    code: { type: "string", required: true, unique: true }, // Stable source/project code
    conceptId: { type: "string", nullable: true, index: true }, // Stable UNILEX ID when this record maps to a reviewed concept
    localized: { type: "jsonb", nullable: true }, // Locale-keyed labels and descriptions; absent locales are not guessed
    editorialStatus: { type: "string", required: true, defaultTo: "DRAFT_REVIEW", index: true },
    arabic: { type: "string", nullable: true }, // Source-language form
    translit: { type: "string", required: true }, // Transliteration
    term: { type: "string", required: true }, // Canonical English display label
    attribute: { type: "string", required: true }, // English project capability or mapping label
    revelations: { type: "string", required: true }, // Provenance reference; not an equivalence claim
    domain: { type: "string", required: true }, // Canonical English domain label
    wisdom: { type: "text", required: true }, // Scoped English project note, not theological definition
    category: { type: "string", defaultTo: "asma" }, // Record category
  };

  code!: string;
  conceptId?: string | null;
  localized?: Record<string, Record<string, string>> | null;
  editorialStatus!: "DRAFT_REVIEW" | "SOURCE_CHECK" | "LINGUISTIC_REVIEW" | "APPROVED" | "DEPRECATED";
  arabic?: string | null;
  translit!: string;
  term!: string;
  attribute!: string;
  revelations!: string;
  domain!: string;
  wisdom!: string;
  category!: string;
}
