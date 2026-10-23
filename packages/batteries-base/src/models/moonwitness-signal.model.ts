import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** Tenant-local Signal/FieldNote; provenance and editorial labels remain claims, not verification. */
export class MoonwitnessSignalModel extends BatteriesModel {
  static override tableName = "moonwitness_signals";
  static override uniqueConstraints = [["tenantId", "id"]];
  static override foreignConstraints = [
    { columns: ["tenantId", "authorId"], references: { table: "tenant_memberships", columns: ["tenantId", "userId"], onDelete: "RESTRICT" as const } },
    { columns: ["tenantId", "characterId"], references: { table: "moonwitness_characters", columns: ["tenantId", "id"], onDelete: "RESTRICT" as const } },
  ];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    authorId: { type: "uuid", required: true, index: true },
    characterId: { type: "uuid", nullable: true, index: true },
    title: { type: "string", required: true, index: true },
    body: { type: "text", required: true },
    contentCategory: { type: "string", required: true, index: true },
    editorialClassification: { type: "string", required: true, defaultTo: "internal", index: true },
    claimedAt: { type: "timestamp", nullable: true, index: true },
    observedAt: { type: "timestamp", nullable: true, index: true },
    sourceMetadata: { type: "jsonb", required: true, defaultTo: "{}" },
    evidenceLinks: { type: "jsonb", required: true, defaultTo: "[]" },
    testimonyConsentStatus: { type: "string", required: true, defaultTo: "not_applicable", index: true },
    testimonyConsentScope: { type: "text", nullable: true },
    testimonyConsentCapturedAt: { type: "timestamp", nullable: true },
    testimonyConsentRevokedAt: { type: "timestamp", nullable: true },
    sensitiveLocation: { type: "boolean", required: true, defaultTo: false, index: true },
    locationDisclosure: { type: "string", required: true, defaultTo: "none" },
    locationLabel: { type: "string", nullable: true },
    privacyStatus: { type: "string", required: true, defaultTo: "private", index: true },
  };

  tenantId!: string; authorId!: string; characterId?: string | null; title!: string; body!: string;
  contentCategory!: "fiction" | "user_testimony" | "scriptural_quotation" | "historical_assertion" | "interpretation" | "empirical_claim" | "project_concept";
  editorialClassification!: "public" | "internal" | "confidential" | "restricted"; claimedAt?: Date | null; observedAt?: Date | null;
  sourceMetadata!: Record<string, unknown>; evidenceLinks!: Array<Record<string, unknown>>; sensitiveLocation!: boolean;
  testimonyConsentStatus!: "not_applicable" | "pending" | "granted" | "revoked"; testimonyConsentScope?: string | null;
  testimonyConsentCapturedAt?: Date | null; testimonyConsentRevokedAt?: Date | null;
  locationDisclosure!: "none" | "generalized"; locationLabel?: string | null; privacyStatus!: "private" | "consented";
}
