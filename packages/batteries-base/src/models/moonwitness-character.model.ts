import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Editorial character/persona. Fictional personas are content records, never principals. */
export class MoonwitnessCharacterModel extends BatteriesModel {
  static override tableName = "moonwitness_characters";
  static override uniqueConstraints = [["tenantId", "id"]];
  static override foreignConstraints = [
    { columns: ["tenantId", "collectionId"], references: { table: "moonwitness_collections", columns: ["tenantId", "id"], onDelete: "RESTRICT" as const } },
    { columns: ["tenantId", "storyId"], references: { table: "moonwitness_stories", columns: ["tenantId", "id"], onDelete: "RESTRICT" as const } },
  ];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    collectionId: { type: "uuid", nullable: true, index: true },
    storyId: { type: "uuid", nullable: true, index: true },
    slug: { type: "string", required: true, index: true },
    displayName: { type: "string", required: true, index: true },
    aliases: { type: "jsonb", required: true, defaultTo: "[]" },
    kind: { type: "string", required: true, index: true },
    editorialClassification: { type: "string", required: true, defaultTo: "internal", index: true },
    consentStatus: { type: "string", required: true, defaultTo: "not_applicable", index: true },
    consentScope: { type: "text", nullable: true },
    consentCapturedAt: { type: "timestamp", nullable: true },
    consentRevokedAt: { type: "timestamp", nullable: true },
  };

  tenantId!: string; collectionId?: string | null; storyId?: string | null; slug!: string; displayName!: string;
  aliases!: string[]; kind!: "fictional" | "real_contributor"; editorialClassification!: "public" | "internal" | "confidential" | "restricted";
  consentStatus!: "not_applicable" | "granted" | "revoked"; consentScope?: string | null; consentCapturedAt?: Date | null; consentRevokedAt?: Date | null;
}
