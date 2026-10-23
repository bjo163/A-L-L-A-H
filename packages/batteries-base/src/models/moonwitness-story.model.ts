import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** A tenant-owned story. Collection and author references are tenant-composite. */
export class MoonwitnessStoryModel extends BatteriesModel {
  static override tableName = "moonwitness_stories";
  static override uniqueConstraints = [["tenantId", "collectionId", "slug"], ["tenantId", "id"]];
  static override foreignConstraints = [
    {
      columns: ["tenantId", "collectionId"],
      references: { table: "moonwitness_collections", columns: ["tenantId", "id"], onDelete: "CASCADE" as const },
    },
    {
      columns: ["tenantId", "authorId"],
      references: { table: "tenant_memberships", columns: ["tenantId", "userId"], onDelete: "RESTRICT" as const },
    },
  ];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    collectionId: { type: "uuid", required: true, index: true },
    authorId: { type: "uuid", required: true, index: true },
    slug: { type: "string", required: true },
    title: { type: "string", required: true, index: true },
    synopsis: { type: "text", nullable: true },
    body: { type: "text", required: true },
    editorialState: { type: "string", required: true, defaultTo: "draft", index: true },
    classification: { type: "string", required: true, defaultTo: "internal", index: true },
    visibility: { type: "string", required: true, defaultTo: "private", index: true },
    revision: { type: "integer", required: true, defaultTo: 1 },
    scheduledAt: { type: "timestamp", nullable: true, index: true },
  };

  tenantId!: string;
  collectionId!: string;
  authorId!: string;
  slug!: string;
  title!: string;
  synopsis?: string | null;
  body!: string;
  editorialState!: "idea" | "draft" | "in_review" | "changes_requested" | "approved" | "scheduled" | "published" | "archived";
  classification!: "public" | "internal" | "confidential" | "restricted";
  visibility!: "private" | "unlisted" | "public";
  revision!: number;
  scheduledAt?: Date | null;
}
