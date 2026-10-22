
import { pgSchema, uuid, text, timestamp, jsonb, uniqueIndex, boolean } from "drizzle-orm/pg-core";
const sys = pgSchema("empire_system");
export const tenants=sys.table("tenants",{
  id:uuid("id").defaultRandom().primaryKey(),
  slug:text("slug").notNull().unique(),
  displayName:text("display_name").notNull(),
  createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
export const memberships=sys.table("operator_memberships",{
  id:uuid("id").defaultRandom().primaryKey(),
  tenantId:uuid("tenant_id").notNull().references(()=>tenants.id),
  subjectId:text("subject_id").notNull(),
  role:text("role").notNull(),
  active:boolean("active").default(true).notNull(),
  createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
},(t)=>[uniqueIndex("tenant_operator_unique").on(t.tenantId,t.subjectId,t.role)]);
export const moduleInstallations=sys.table("module_installations",{
  id:uuid("id").defaultRandom().primaryKey(),
  tenantId:uuid("tenant_id").notNull().references(()=>tenants.id),
  moduleId:text("module_id").notNull(),
  version:text("version").notNull(),
  state:text("state").notNull(),
  approvedBy:text("approved_by"),
  updatedAt:timestamp("updated_at",{withTimezone:true}).defaultNow().notNull()
},t=>[uniqueIndex("tenant_module_unique").on(t.tenantId,t.moduleId)]);
export const auditEvents=sys.table("audit_events",{
  id:uuid("id").defaultRandom().primaryKey(),
  tenantId:uuid("tenant_id").notNull().references(()=>tenants.id),
  actorId:text("actor_id").notNull(),
  action:text("action").notNull(),
  resourceId:text("resource_id"),
  traceId:text("trace_id"),
  payload:jsonb("payload").$type<Record<string,unknown>>(),
  createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull()
});
