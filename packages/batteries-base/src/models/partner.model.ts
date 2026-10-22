import {
  BatteriesModel,
  Model,
  type FieldDefinition,
  type RelationMappings,
  type RelationMappingsThunk,
} from "@empire/batteries";
import { UserModel } from "./user.model.js";

/** Shared contact/company identity. Login credentials remain on UserModel. */
export class PartnerModel extends BatteriesModel {
  static override tableName = "partners";
  static override uniqueConstraints = [["tenantId", "userId"]];

  static override fields: Record<string, FieldDefinition> = {
    // Kept nullable for one schema sync so existing rows can be backfilled losslessly.
    tenantId: { type: "uuid", nullable: true, index: true, references: { table: "tenants", column: "id", onDelete: "CASCADE" } },
    name: { type: "string", required: true, index: true },
    companyName: { type: "string", nullable: true, index: true },
    type: { type: "string", required: true, defaultTo: "contact", index: true },
    isCompany: { type: "boolean", required: true, defaultTo: false, index: true },
    parentId: { type: "uuid", nullable: true, index: true, references: { table: "partners", column: "id", onDelete: "SET NULL" } },
    userId: { type: "uuid", nullable: true, index: true, references: { table: "users", column: "id", onDelete: "SET NULL" } },
    email: { type: "string", nullable: true, index: true },
    phone: { type: "string", nullable: true },
    mobile: { type: "string", nullable: true },
    website: { type: "string", nullable: true },
    street: { type: "string", nullable: true },
    street2: { type: "string", nullable: true },
    city: { type: "string", nullable: true, index: true },
    state: { type: "string", nullable: true },
    postalCode: { type: "string", nullable: true },
    country: { type: "string", nullable: true },
    vat: { type: "string", nullable: true },
    function: { type: "string", nullable: true },
    notes: { type: "text", nullable: true },
    metadata: { type: "jsonb", nullable: true },
  };

  tenantId?: string | null;
  name!: string;
  companyName?: string | null;
  type!: "contact" | "invoice" | "delivery" | "other";
  isCompany!: boolean;
  parentId?: string | null;
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  vat?: string | null;
  function?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  user?: UserModel | null;
  parent?: PartnerModel | null;
  contacts?: PartnerModel[];

  static override relationMappings: RelationMappings | RelationMappingsThunk = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: { from: "partners.user_id", to: "users.id" },
    },
    parent: {
      relation: Model.BelongsToOneRelation,
      modelClass: PartnerModel,
      join: { from: "partners.parent_id", to: "partners.id" },
    },
    contacts: {
      relation: Model.HasManyRelation,
      modelClass: PartnerModel,
      join: { from: "partners.id", to: "partners.parent_id" },
    },
  });
}
