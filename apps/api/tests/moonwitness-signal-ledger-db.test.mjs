import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import knexFactory from "knex";
import { BatteriesModel, syncModels, uuidv7, preflightModels } from "@empire/batteries";
import {
  MoonwitnessCharacterModel, MoonwitnessSignalModel, MoonwitnessCollectionModel, MoonwitnessStoryModel,
  TenantMembershipModel, TenantModel, UserModel,
} from "@empire/batteries-base";

const databaseUrl = process.env.EOL_TEST_DATABASE_URL;
test("Moonwitness character and Signal Ledger records enforce tenant boundaries and preserve labels", { skip: !databaseUrl }, async () => {
  const parsedUrl = new URL(databaseUrl);
  assert.equal(parsedUrl.hostname, "127.0.0.1", "integration must use local disposable PostgreSQL");
  assert.equal(parsedUrl.pathname, "/eol_issue18_test", "only the named disposable integration database is accepted");
  const admin = knexFactory({ client: "pg", connection: databaseUrl, pool: { min: 0, max: 1 } });
  const schema = `issue20_${randomUUID().replaceAll("-", "")}`;
  await admin.schema.createSchema(schema);
  const db = knexFactory({ client: "pg", connection: databaseUrl, searchPath: [schema], pool: { min: 0, max: 4 } });
  BatteriesModel.knex(db);
  const models = [TenantModel, UserModel, TenantMembershipModel, MoonwitnessCollectionModel, MoonwitnessStoryModel, MoonwitnessCharacterModel, MoonwitnessSignalModel];
  try {
    await syncModels(db, models);
    const report = await preflightModels(db, models);
    assert.equal(report.ok, true, JSON.stringify(report.models.flatMap(({ table, blockers }) => blockers.map((blocker) => `${table}: ${blocker}`))));
    const tenantA = uuidv7(); const tenantB = uuidv7(); const authorA = uuidv7(); const authorB = uuidv7();
    await db("tenants").insert([
      { id: tenantA, slug: `issue20-a-${tenantA}`, display_name: "Tenant A", status: "active" },
      { id: tenantB, slug: `issue20-b-${tenantB}`, display_name: "Tenant B", status: "active" },
    ]);
    await db("users").insert([
      { id: authorA, username: `issue20-a-${authorA}`, email: `${authorA}@example.invalid`, password_hash: "test", display_name: "Author A", status: "active" },
      { id: authorB, username: `issue20-b-${authorB}`, email: `${authorB}@example.invalid`, password_hash: "test", display_name: "Author B", status: "active" },
    ]);
    await db("tenant_memberships").insert([
      { id: uuidv7(), tenant_id: tenantA, user_id: authorA, role: "member", status: "active" },
      { id: uuidv7(), tenant_id: tenantB, user_id: authorB, role: "member", status: "active" },
    ]);
    const collectionId = uuidv7(); const storyId = uuidv7();
    await db("moonwitness_collections").insert({ id: collectionId, tenant_id: tenantA, owner_id: authorA, slug: "series", title: "Series", theme: "moonwitness", language: "id", status: "draft", visibility: "private" });
    await db("moonwitness_stories").insert({ id: storyId, tenant_id: tenantA, collection_id: collectionId, author_id: authorA, slug: "story", title: "Story", body: "Draft", editorial_state: "draft", classification: "internal", visibility: "private", revision: 1 });
    const fictionalId = uuidv7(); const realId = uuidv7();
    await db("moonwitness_characters").insert([
      { id: fictionalId, tenant_id: tenantA, collection_id: collectionId, story_id: storyId, slug: "fictional-persona", display_name: "Fictional Persona", aliases: JSON.stringify(["The Guide"]), kind: "fictional", editorial_classification: "internal", consent_status: "not_applicable" },
      { id: realId, tenant_id: tenantA, collection_id: collectionId, slug: "consenting-contributor", display_name: "Consenting Contributor", aliases: JSON.stringify([]), kind: "real_contributor", editorial_classification: "confidential", consent_status: "granted", consent_scope: "Use anonymized account", consent_captured_at: "2026-10-23T00:00:00Z" },
    ]);
    const signalId = uuidv7();
    await db("moonwitness_signals").insert({
      id: signalId, tenant_id: tenantA, author_id: authorA, character_id: realId, title: "Private account", body: "A claimed account, pending review.",
      content_category: "user_testimony", editorial_classification: "restricted", claimed_at: "2026-10-22T10:00:00Z", observed_at: "2026-10-22T10:01:00Z",
      source_metadata: { sourceName: "Interview" }, evidence_links: JSON.stringify([{ label: "Transcript", url: "https://example.invalid/transcript" }]), sensitive_location: true,
      location_disclosure: "none", location_label: null, privacy_status: "private", testimony_consent_status: "pending",
    });
    await assert.rejects(db("moonwitness_characters").insert({ id: uuidv7(), tenant_id: tenantB, collection_id: collectionId, slug: "cross-tenant", display_name: "Wrong Tenant", aliases: "[]", kind: "fictional", editorial_classification: "internal", consent_status: "not_applicable" }), (error) => error.code === "23503");
    await assert.rejects(db("moonwitness_signals").insert({ id: uuidv7(), tenant_id: tenantA, author_id: authorB, title: "Wrong author", body: "Cross-tenant", content_category: "fiction", editorial_classification: "internal", source_metadata: {}, evidence_links: "[]", sensitive_location: false, location_disclosure: "none", privacy_status: "private", testimony_consent_status: "not_applicable" }), (error) => error.code === "23503");
    await assert.rejects(db("moonwitness_signals").insert({ id: uuidv7(), tenant_id: tenantB, author_id: authorB, character_id: fictionalId, title: "Cross-tenant", body: "Cross-tenant", content_category: "fiction", editorial_classification: "internal", source_metadata: {}, evidence_links: "[]", sensitive_location: false, location_disclosure: "none", privacy_status: "private", testimony_consent_status: "not_applicable" }), (error) => error.code === "23503");
    await assert.rejects(db("moonwitness_signals").insert({ id: uuidv7(), tenant_id: tenantA, author_id: fictionalId, title: "Persona cannot author as user", body: "No identity principal", content_category: "fiction", editorial_classification: "internal", source_metadata: {}, evidence_links: "[]", sensitive_location: false, location_disclosure: "none", privacy_status: "private", testimony_consent_status: "not_applicable" }), (error) => error.code === "23503");

    await MoonwitnessSignalModel.query().where({ id: signalId, tenant_id: tenantA }).patch({ editorialClassification: "confidential" });
    const edited = await db("moonwitness_signals").where({ id: signalId, tenant_id: tenantA }).first();
    assert.equal(edited.editorial_classification, "confidential");
    assert.equal(edited.content_category, "user_testimony");
    assert.equal(edited.privacy_status, "private");
    assert.equal(edited.testimony_consent_status, "pending");
    assert.deepEqual(edited.source_metadata, { sourceName: "Interview" });
    assert.deepEqual(edited.evidence_links, [{ label: "Transcript", url: "https://example.invalid/transcript" }]);
    assert.equal(edited.location_label, null);
    assert.equal("exact_coordinates" in edited, false);
    const fictional = await db("moonwitness_characters").where({ id: fictionalId, tenant_id: tenantA }).first();
    assert.equal(fictional.kind, "fictional");
    assert.equal("permissions" in fictional, false);
  } finally {
    await db.destroy();
    BatteriesModel.knex(null);
    await admin.schema.dropSchemaIfExists(schema, true);
    await admin.destroy();
  }
});
