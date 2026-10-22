import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** File bytes live in object storage; this row stores tenant-scoped metadata and integrity. */
export class DocumentModel extends BatteriesModel {
  static override tableName = "documents";
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    projectId: { type: "uuid", required: true, index: true, references: { table: "projects", column: "id", onDelete: "CASCADE" } },
    taskId: { type: "uuid", nullable: true, index: true, references: { table: "tasks", column: "id", onDelete: "SET NULL" } },
    researchRunId: { type: "uuid", nullable: true, index: true, references: { table: "research_runs", column: "id", onDelete: "SET NULL" } },
    uploadedBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
    title: { type: "string", required: true, index: true },
    fileName: { type: "string", required: true },
    storageProvider: { type: "string", required: true },
    storageKey: { type: "string", required: true },
    mediaType: { type: "string", required: true },
    sizeBytes: { type: "bigint", required: true },
    sha256: { type: "string", required: true },
    version: { type: "integer", required: true, defaultTo: 1 },
    classification: { type: "string", required: true, defaultTo: "internal", index: true },
    license: { type: "string", nullable: true },
    provenance: { type: "jsonb", nullable: true },
    status: { type: "string", required: true, defaultTo: "active", index: true },
  };
  tenantId!: string;
  projectId!: string;
  taskId?: string | null;
  researchRunId?: string | null;
  uploadedBy!: string;
  title!: string;
  fileName!: string;
  storageProvider!: string;
  storageKey!: string;
  mediaType!: string;
  sizeBytes!: string;
  sha256!: string;
  version!: number;
  classification!: "public" | "internal" | "confidential" | "restricted";
  license?: string | null;
  provenance?: Record<string, unknown> | null;
  status!: "active" | "archived";
}
