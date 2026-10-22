import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Immutable staging ledger for lossless, reviewed migration from dictionaries to UNILEX. */
export class LegacyDictionaryImportModel extends BatteriesModel {
  static override tableName = "legacy_dictionary_imports";
  static override uniqueConstraints = [["sourceTable", "legacySourceId"]];
  static override fields: Record<string, FieldDefinition> = {
    sourceTable: { type: "string", required: true, index: true },
    legacySourceId: { type: "string", required: true, index: true },
    legacyCode: { type: "string", required: true, index: true },
    sourceHash: { type: "string", required: true, index: true },
    batchId: { type: "string", required: true, index: true },
    sourceSnapshot: { type: "jsonb", required: true },
    canonicalProposal: { type: "jsonb", required: true },
    targetConceptId: { type: "string", nullable: true, index: true },
    reviewStatus: { type: "string", required: true, defaultTo: "unreviewed", index: true },
    reviewNotes: { type: "text", nullable: true },
  };
  sourceTable!: string;
  legacySourceId!: string;
  legacyCode!: string;
  sourceHash!: string;
  batchId!: string;
  sourceSnapshot!: Record<string, unknown>;
  canonicalProposal!: Record<string, unknown>;
  targetConceptId?: string | null;
  reviewStatus!: "unreviewed" | "mapped" | "rejected";
  reviewNotes?: string | null;
}
