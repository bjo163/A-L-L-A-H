import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

/** A tenant-local association; Sentinel observations themselves remain global. */
export class YoutubeSentinelPartnerLinkModel extends BatteriesModel {
  static override tableName = "youtube_sentinel_partner_links";
  static override uniqueConstraints = [["tenantId", "itemId"]];
  static override fields: Record<string, FieldDefinition> = {
    tenantId: { type: "uuid", required: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    itemId: { type: "uuid", required: true, index: true, references: { table: "youtube_sentinel_items", column: "id", onDelete: "CASCADE" } },
    partnerId: { type: "uuid", required: true, index: true, references: { table: "partners", column: "id", onDelete: "CASCADE" } },
    createdBy: { type: "uuid", required: true, references: { table: "users", column: "id", onDelete: "RESTRICT" } },
  };
  tenantId!: string;
  itemId!: string;
  partnerId!: string;
  createdBy!: string;
}
