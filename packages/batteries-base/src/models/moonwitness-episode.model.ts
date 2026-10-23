import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-owned ordered episode inside a story. */
export class MoonwitnessEpisodeModel extends BatteriesModel {
  static override tableName = "moonwitness_episodes";
  static override uniqueConstraints = [["tenantId", "storyId", "slug"], ["tenantId", "storyId", "sequence"], ["tenantId", "id"]];
  static override foreignConstraints = [{ columns: ["tenantId", "storyId"], references: { table: "moonwitness_stories", columns: ["tenantId", "id"], onDelete: "CASCADE" as const } }];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    storyId: { type: "uuid", required: true, index: true }, slug: { type: "string", required: true },
    title: { type: "string", required: true }, synopsis: { type: "text", nullable: true },
    sequence: { type: "integer", required: true }, status: { type: "string", required: true, defaultTo: "draft" },
  };
  tenantId!: string; storyId!: string; slug!: string; title!: string; synopsis?: string | null; sequence!: number; status!: "draft" | "published" | "archived";
}
