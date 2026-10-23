import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-owned ordered comic page; alt text is required for accessible artwork. */
export class MoonwitnessComicPageModel extends BatteriesModel {
  static override tableName = "moonwitness_comic_pages";
  static override uniqueConstraints = [["tenantId", "sceneId", "sequence"], ["tenantId", "id"]];
  static override foreignConstraints = [{ columns: ["tenantId", "sceneId"], references: { table: "moonwitness_scenes", columns: ["tenantId", "id"], onDelete: "CASCADE" as const } }];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    sceneId: { type: "uuid", required: true, index: true }, sequence: { type: "integer", required: true },
    assetUrl: { type: "text", required: true }, altText: { type: "text", required: true },
    status: { type: "string", required: true, defaultTo: "draft" },
  };
  tenantId!: string; sceneId!: string; sequence!: number; assetUrl!: string; altText!: string; status!: "draft" | "published" | "archived";
}
