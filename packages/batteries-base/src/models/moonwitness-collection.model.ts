import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-owned editorial collection. The module owner is metadata, never an auth principal. */
export class MoonwitnessCollectionModel extends BatteriesModel {
  static override tableName = "moonwitness_collections";
  static override uniqueConstraints = [["tenantId", "slug"], ["tenantId", "id"]];
  static override foreignConstraints = [{
    columns: ["tenantId", "ownerId"],
    references: { table: "tenant_memberships", columns: ["tenantId", "userId"], onDelete: "RESTRICT" as const },
  }];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    ownerId: { type: "uuid", required: true, index: true },
    slug: { type: "string", required: true },
    title: { type: "string", required: true, index: true },
    cover: { type: "text", nullable: true },
    theme: { type: "string", required: true, defaultTo: "moonwitness" },
    language: { type: "string", required: true, defaultTo: "id" },
    status: { type: "string", required: true, defaultTo: "draft", index: true },
    visibility: { type: "string", required: true, defaultTo: "private", index: true },
  };

  tenantId!: string;
  ownerId!: string;
  slug!: string;
  title!: string;
  cover?: string | null;
  theme!: string;
  language!: string;
  status!: "draft" | "published" | "archived";
  visibility!: "private" | "unlisted" | "public";
}
