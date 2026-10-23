import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-safe association from a story to an existing tenant-local tag. */
export class MoonwitnessStoryTagModel extends BatteriesModel {
  static override tableName = "moonwitness_story_tags";
  static override uniqueConstraints = [["tenantId", "storyId", "tagId"]];
  static override foreignConstraints = [
    {
      columns: ["tenantId", "storyId"],
      references: { table: "moonwitness_stories", columns: ["tenantId", "id"], onDelete: "CASCADE" as const },
    },
    {
      columns: ["tenantId", "tagId"],
      references: { table: "tags", columns: ["tenantId", "id"], onDelete: "CASCADE" as const },
    },
  ];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    storyId: { type: "uuid", required: true, index: true },
    tagId: { type: "uuid", required: true, index: true },
  };

  tenantId!: string;
  storyId!: string;
  tagId!: string;
}
