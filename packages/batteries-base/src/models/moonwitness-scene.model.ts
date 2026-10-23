import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-owned ordered scene inside an episode. */
export class MoonwitnessSceneModel extends BatteriesModel {
  static override tableName = "moonwitness_scenes";
  static override uniqueConstraints = [["tenantId", "episodeId", "slug"], ["tenantId", "episodeId", "sequence"], ["tenantId", "id"]];
  static override foreignConstraints = [{ columns: ["tenantId", "episodeId"], references: { table: "moonwitness_episodes", columns: ["tenantId", "id"], onDelete: "CASCADE" as const } }];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    episodeId: { type: "uuid", required: true, index: true }, slug: { type: "string", required: true },
    title: { type: "string", required: true }, sequence: { type: "integer", required: true },
    status: { type: "string", required: true, defaultTo: "draft" },
  };
  tenantId!: string; episodeId!: string; slug!: string; title!: string; sequence!: number; status!: "draft" | "published" | "archived";
}
