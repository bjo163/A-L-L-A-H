import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Append-only tenant-scoped snapshot of an editorial story version. */
export class MoonwitnessContentRevisionModel extends BatteriesModel {
  static override tableName = "moonwitness_content_revisions";
  static override uniqueConstraints = [["tenantId", "storyId", "revision"], ["tenantId", "id"]];
  static override foreignConstraints = [
    { columns: ["tenantId", "storyId"], references: { table: "moonwitness_stories", columns: ["tenantId", "id"], onDelete: "RESTRICT" as const } },
    { columns: ["tenantId", "actorId"], references: { table: "tenant_memberships", columns: ["tenantId", "userId"], onDelete: "RESTRICT" as const } },
  ];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    storyId: { type: "uuid", required: true, index: true },
    revision: { type: "integer", required: true },
    actorId: { type: "uuid", required: true, index: true },
    reason: { type: "text", required: true },
    snapshot: { type: "jsonb", required: true },
    sha256: { type: "string", required: true, index: true },
    provenance: { type: "jsonb", required: true, defaultTo: "{}" },
  };
  tenantId!: string; storyId!: string; revision!: number; actorId!: string; reason!: string;
  snapshot!: Record<string, unknown>; sha256!: string; provenance!: Record<string, unknown>;
}
