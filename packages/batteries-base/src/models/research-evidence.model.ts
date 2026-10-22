import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ResearchEvidenceModel extends BatteriesModel {
  static override tableName = "research_evidence";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "tenants", column: "id", onDelete: "CASCADE" },
    },
    researchRunId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "research_runs", column: "id", onDelete: "CASCADE" },
    },
    jobId: {
      type: "uuid",
      nullable: true,
      references: { table: "research_jobs", column: "id", onDelete: "SET NULL" },
    },
    submittedBy: {
      type: "uuid",
      required: true,
      references: { table: "users", column: "id", onDelete: "RESTRICT" },
    },
    title: { type: "string", required: true },
    sourceUri: { type: "text", required: true },
    sourceFamily: { type: "string", required: true },
    classification: { type: "string", required: true },
    excerpt: { type: "text", required: true },
    contentHash: { type: "string", required: true },
    provenance: { type: "jsonb", required: true },
  };

  tenantId!: string;
  researchRunId!: string;
  jobId?: string | null;
  submittedBy!: string;
  title!: string;
  sourceUri!: string;
  sourceFamily!: string;
  classification!: string;
  excerpt!: string;
  contentHash!: string;
  provenance!: Record<string, unknown>;
}
