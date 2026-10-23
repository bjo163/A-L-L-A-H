import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Immutable record of a published snapshot; later edits never rewrite it. */
export class MoonwitnessPublicationModel extends BatteriesModel {
  static override tableName = "moonwitness_publications";
  static override uniqueConstraints = [["tenantId", "id"]];
  static override foreignConstraints = [
    { columns: ["tenantId", "storyId"], references: { table: "moonwitness_stories", columns: ["tenantId", "id"], onDelete: "RESTRICT" as const } },
    { columns: ["tenantId", "revisionId"], references: { table: "moonwitness_content_revisions", columns: ["tenantId", "id"], onDelete: "RESTRICT" as const } },
    { columns: ["tenantId", "publisherId"], references: { table: "tenant_memberships", columns: ["tenantId", "userId"], onDelete: "RESTRICT" as const } },
  ];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    storyId: { type: "uuid", required: true, index: true },
    revisionId: { type: "uuid", required: true, index: true },
    publisherId: { type: "uuid", required: true, index: true },
    snapshot: { type: "jsonb", required: true },
    sha256: { type: "string", required: true, index: true },
    publishedAt: { type: "timestamp", required: true, index: true },
  };
  tenantId!: string; storyId!: string; revisionId!: string; publisherId!: string;
  snapshot!: Record<string, unknown>; sha256!: string; publishedAt!: Date;
}
