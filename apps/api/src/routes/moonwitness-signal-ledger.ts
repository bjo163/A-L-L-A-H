import type { FastifyInstance, FastifyReply } from "fastify";
import { MoonwitnessCharacterModel, MoonwitnessSignalModel } from "@empire/batteries-base";
import { MOONWITNESS_CHARACTER_CREATE_SCHEMA, MOONWITNESS_CHARACTER_PATCH_SCHEMA, MOONWITNESS_SIGNAL_CREATE_SCHEMA, MOONWITNESS_SIGNAL_PATCH_SCHEMA } from "@empire/api-contract";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const categories = new Set(["fiction", "user_testimony", "scriptural_quotation", "historical_assertion", "interpretation", "empirical_claim", "project_concept"]);
const classifications = new Set(["public", "internal", "confidential", "restricted"]);
const sensitiveLocationLevels = new Set(["none", "generalized"]);

export function isValidRealContributorConsent(input: Record<string, unknown>) {
  return input.kind !== "real_contributor" || input.consentStatus === "granted" && typeof input.consentScope === "string" && input.consentScope.trim().length > 0 && isDateTime(input.consentCapturedAt);
}

export function isSafeSignalLocation(input: Record<string, unknown>) {
  const disclosure = input.locationDisclosure ?? "none";
  if (!sensitiveLocationLevels.has(String(disclosure))) return false;
  if (input.sensitiveLocation === true && (disclosure !== "none" || input.locationLabel !== undefined && input.locationLabel !== null)) return false;
  return input.locationLabel === undefined || typeof input.locationLabel === "string" && input.locationLabel.length <= 120;
}

export function isValidTestimonyConsent(input: Record<string, unknown>) {
  if (input.contentCategory !== "user_testimony") return !["testimonyConsentStatus", "testimonyConsentScope", "testimonyConsentCapturedAt", "testimonyConsentRevokedAt"].some((key) => key in input);
  if (input.testimonyConsentStatus === "granted") return typeof input.testimonyConsentScope === "string" && input.testimonyConsentScope.trim().length > 0 && isDateTime(input.testimonyConsentCapturedAt);
  return input.testimonyConsentStatus === undefined || input.testimonyConsentStatus === "pending" || input.testimonyConsentStatus === "revoked" && isDateTime(input.testimonyConsentRevokedAt);
}

function isDateTime(value: unknown): value is string {
  return value instanceof Date ? Number.isFinite(value.getTime()) : typeof value === "string" && Number.isFinite(Date.parse(value));
}

function invalid(reply: FastifyReply, message: string) { return reply.code(400).send({ status: "invalid_request", message }); }
function text(value: unknown, max: number): value is string { return typeof value === "string" && value.trim().length > 0 && value.length <= max; }
function validAliases(value: unknown) { return value === undefined || Array.isArray(value) && value.length <= 30 && value.every((alias) => text(alias, 160)) && new Set(value).size === value.length; }
function validSourceMetadata(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const allowed = new Set(["sourceName", "sourceUrl", "sourcePublishedAt", "notes"]);
  return Object.keys(item).every((key) => allowed.has(key)) && (item.sourceName === undefined || typeof item.sourceName === "string" && item.sourceName.length <= 200)
    && (item.sourceUrl === undefined || typeof item.sourceUrl === "string" && item.sourceUrl.length <= 2048)
    && (item.sourcePublishedAt === undefined || isDateTime(item.sourcePublishedAt)) && (item.notes === undefined || typeof item.notes === "string" && item.notes.length <= 2000);
}
function validEvidenceLinks(value: unknown) {
  return value === undefined || Array.isArray(value) && value.length <= 50 && value.every((entry) => !!entry && typeof entry === "object" && !Array.isArray(entry)
    && Object.keys(entry).every((key) => key === "label" || key === "url") && text((entry as Record<string, unknown>).label, 160) && text((entry as Record<string, unknown>).url, 2048));
}
function queryLimit(value: unknown) { const parsed = Number(value ?? 50); return Number.isInteger(parsed) && parsed >= 1 ? Math.min(parsed, 100) : 50; }
function queryText(value: unknown) { return typeof value === "string" ? value.trim().slice(0, 100) : ""; }

export async function moonwitnessSignalLedgerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requireTenant);

  app.get("/v1/moonwitness/characters", { preHandler: requirePermission("moonwitness:read") }, async (request) => {
    const query = request.query as Record<string, unknown>;
    const term = queryText(query.q);
    let builder = MoonwitnessCharacterModel.query().where({ tenant_id: request.tenantId! }).orderBy("display_name", "asc").limit(queryLimit(query.limit));
    if (term) builder = builder.where((nested: any) => nested.whereILike("display_name", `%${term}%`).orWhereILike("slug", `%${term}%`));
    return builder;
  });

  app.post("/v1/moonwitness/characters", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_CHARACTER_CREATE_SCHEMA } }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    if (!text(body.slug, 80) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || !text(body.displayName, 160) || !["fictional", "real_contributor"].includes(String(body.kind)) || !validAliases(body.aliases) || !isValidRealContributorConsent(body)) return invalid(reply, "Data karakter atau consent kontributor tidak valid.");
    if (body.kind === "fictional" && ["consentStatus", "consentScope", "consentCapturedAt", "consentRevokedAt"].some((key) => key in body)) return invalid(reply, "Persona fiksi tidak memiliki data consent atau identitas kontributor.");
    if (body.editorialClassification !== undefined && !classifications.has(String(body.editorialClassification))) return invalid(reply, "Klasifikasi editorial tidak valid.");
    const collectionId = body.collectionId as string | undefined;
    const storyId = body.storyId as string | undefined;
    if (collectionId && !uuidPattern.test(collectionId) || storyId && !uuidPattern.test(storyId)) return invalid(reply, "Referensi harus berupa UUID.");
    const created = await (MoonwitnessCharacterModel.query() as any).insert({
      tenantId: request.tenantId!, collectionId: collectionId ?? null, storyId: storyId ?? null,
      slug: (body.slug as string).trim(), displayName: (body.displayName as string).trim(), aliases: JSON.stringify(body.aliases ?? []), kind: body.kind,
      editorialClassification: body.editorialClassification ?? "internal",
      consentStatus: body.kind === "real_contributor" ? body.consentStatus : "not_applicable",
      consentScope: body.kind === "real_contributor" ? body.consentScope : null,
      consentCapturedAt: body.kind === "real_contributor" ? body.consentCapturedAt : null,
    });
    return reply.code(201).send(created);
  });

  app.patch("/v1/moonwitness/characters/:id", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_CHARACTER_PATCH_SCHEMA } }, async (request, reply) => {
    const { id } = request.params as { id: string }; const body = request.body as Record<string, unknown>;
    if (!uuidPattern.test(id) || !body || typeof body !== "object") return invalid(reply, "ID atau perubahan karakter tidak valid.");
    const character = await MoonwitnessCharacterModel.query().where({ id, tenant_id: request.tenantId! }).first();
    if (!character) return reply.code(404).send({ status: "not_found", message: "Karakter tidak ditemukan." });
    if (body.displayName !== undefined && !text(body.displayName, 160) || !validAliases(body.aliases) || body.editorialClassification !== undefined && !classifications.has(String(body.editorialClassification))) return invalid(reply, "Perubahan karakter tidak valid.");
    if (character.kind === "fictional" && ["consentStatus", "consentScope", "consentCapturedAt", "consentRevokedAt"].some((key) => key in body)) return invalid(reply, "Persona fiksi tidak memiliki data consent kontributor.");
    if (character.kind === "real_contributor" && body.consentStatus === "granted" && !isValidRealContributorConsent({ kind: "real_contributor", ...body })) return invalid(reply, "Grant consent harus memiliki cakupan dan waktu pencatatan.");
    if (character.kind === "real_contributor" && body.consentStatus === "revoked" && !isDateTime(body.consentRevokedAt)) return invalid(reply, "Pencabutan consent harus memiliki waktu pencatatan.");
    const update: Record<string, unknown> = {};
    for (const key of ["displayName", "aliases", "editorialClassification"] as const) if (body[key] !== undefined) update[key] = body[key];
    if (character.kind === "real_contributor") for (const key of ["consentStatus", "consentScope", "consentCapturedAt", "consentRevokedAt"] as const) if (body[key] !== undefined) update[key] = body[key];
    return MoonwitnessCharacterModel.query().where({ id, tenant_id: request.tenantId! }).patch(update);
  });

  app.get("/v1/moonwitness/signals", { preHandler: requirePermission("moonwitness:read") }, async (request) => {
    const query = request.query as Record<string, unknown>; const term = queryText(query.q);
    let builder = MoonwitnessSignalModel.query().where({ tenant_id: request.tenantId! }).orderBy("created_at", "desc").limit(queryLimit(query.limit));
    if (query.contentCategory && categories.has(String(query.contentCategory))) builder = builder.where({ content_category: query.contentCategory });
    if (query.editorialClassification && classifications.has(String(query.editorialClassification))) builder = builder.where({ editorial_classification: query.editorialClassification });
    if (term) builder = builder.where((nested: any) => nested.whereILike("title", `%${term}%`).orWhereILike("body", `%${term}%`));
    return builder;
  });

  app.post("/v1/moonwitness/signals", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_SIGNAL_CREATE_SCHEMA } }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    if (!request.authUser || !text(body.title, 200) || !text(body.body, 30000) || !categories.has(String(body.contentCategory)) || body.editorialClassification !== undefined && !classifications.has(String(body.editorialClassification))) return invalid(reply, "Data signal atau klasifikasi tidak valid.");
    if (!isSafeSignalLocation({ sensitiveLocation: body.sensitiveLocation, locationDisclosure: body.locationDisclosure, locationLabel: body.locationLabel }) || !validSourceMetadata(body.sourceMetadata) || !validEvidenceLinks(body.evidenceLinks)) return invalid(reply, "Lokasi sensitif, provenance, atau evidence link tidak valid.");
    if (body.claimedAt !== undefined && !isDateTime(body.claimedAt) || body.observedAt !== undefined && !isDateTime(body.observedAt)) return invalid(reply, "Waktu klaim dan observasi harus ISO 8601.");
    if (body.characterId !== undefined && (typeof body.characterId !== "string" || !uuidPattern.test(body.characterId))) return invalid(reply, "Referensi karakter harus UUID.");
    if (body.contentCategory === "user_testimony" && body.testimonyConsentStatus !== undefined || body.testimonyConsentStatus !== undefined) return invalid(reply, "Consent kesaksian dicatat melalui alur consent terpisah.");
    if (body.characterId) {
      const character = await MoonwitnessCharacterModel.query().where({ id: body.characterId, tenant_id: request.tenantId! }).first();
      if (!character) return invalid(reply, "Karakter harus berasal dari tenant aktif.");
      if (character.kind === "real_contributor" && character.consentStatus !== "granted") return invalid(reply, "Kontributor nyata harus memiliki consent aktif.");
    }
    const created = await (MoonwitnessSignalModel.query() as any).insert({
      tenantId: request.tenantId!, authorId: request.authUser.id, characterId: body.characterId ?? null,
      title: (body.title as string).trim(), body: (body.body as string).trim(), contentCategory: body.contentCategory,
      editorialClassification: body.editorialClassification ?? "internal", claimedAt: body.claimedAt ?? null, observedAt: body.observedAt ?? null,
      sourceMetadata: body.sourceMetadata ?? {}, evidenceLinks: JSON.stringify(body.evidenceLinks ?? []), sensitiveLocation: body.sensitiveLocation === true,
      locationDisclosure: body.locationDisclosure ?? "none", locationLabel: body.locationLabel ?? null,
      privacyStatus: "private", testimonyConsentStatus: body.contentCategory === "user_testimony" ? "pending" : "not_applicable",
    });
    return reply.code(201).send(created);
  });

  app.patch("/v1/moonwitness/signals/:id", { preHandler: requirePermission("moonwitness:write"), schema: { tags: ["MOONWITNESS"], security: [{ bearerAuth: [], tenantSelection: [] }], body: MOONWITNESS_SIGNAL_PATCH_SCHEMA } }, async (request, reply) => {
    const { id } = request.params as { id: string }; const body = request.body as Record<string, unknown>;
    if (!uuidPattern.test(id) || !body || typeof body !== "object") return invalid(reply, "ID atau perubahan signal tidak valid.");
    const current = await MoonwitnessSignalModel.query().where({ id, tenant_id: request.tenantId! }).first();
    if (!current) return reply.code(404).send({ status: "not_found", message: "Signal tidak ditemukan." });
    if (body.title !== undefined && !text(body.title, 200) || body.body !== undefined && !text(body.body, 30000) || body.contentCategory !== undefined && !categories.has(String(body.contentCategory)) || body.editorialClassification !== undefined && !classifications.has(String(body.editorialClassification))) return invalid(reply, "Perubahan signal tidak valid.");
    if (["sensitiveLocation", "locationDisclosure", "locationLabel"].some((key) => key in body) && !isSafeSignalLocation({
      sensitiveLocation: body.sensitiveLocation ?? current.sensitiveLocation,
      locationDisclosure: body.locationDisclosure ?? current.locationDisclosure,
      locationLabel: body.locationLabel ?? current.locationLabel,
    }) || !validSourceMetadata(body.sourceMetadata) || !validEvidenceLinks(body.evidenceLinks)) return invalid(reply, "Lokasi sensitif, provenance, atau evidence link tidak valid.");
    if (["contentCategory", "testimonyConsentStatus", "testimonyConsentScope", "testimonyConsentCapturedAt", "testimonyConsentRevokedAt"].some((key) => key in body)) {
      const nextCategory = body.contentCategory ?? current.contentCategory;
      const currentConsent = current.testimonyConsentStatus === "not_applicable" ? undefined : current.testimonyConsentStatus;
      const nextConsentStatus = body.testimonyConsentStatus ?? currentConsent;
      const consent = { contentCategory: nextCategory, testimonyConsentStatus: nextConsentStatus,
        testimonyConsentScope: body.testimonyConsentScope ?? current.testimonyConsentScope,
        testimonyConsentCapturedAt: body.testimonyConsentCapturedAt ?? current.testimonyConsentCapturedAt,
        testimonyConsentRevokedAt: body.testimonyConsentRevokedAt ?? current.testimonyConsentRevokedAt };
      if (!isValidTestimonyConsent(consent)) return invalid(reply, "Consent kesaksian harus eksplisit dan tercatat.");
    }
    if (body.claimedAt !== undefined && body.claimedAt !== null && !isDateTime(body.claimedAt) || body.observedAt !== undefined && body.observedAt !== null && !isDateTime(body.observedAt)) return invalid(reply, "Waktu klaim dan observasi harus ISO 8601.");
    const update: Record<string, unknown> = {};
    for (const key of ["title", "body", "contentCategory", "editorialClassification", "claimedAt", "observedAt", "sourceMetadata", "evidenceLinks", "sensitiveLocation", "locationDisclosure", "locationLabel", "testimonyConsentStatus", "testimonyConsentScope", "testimonyConsentCapturedAt", "testimonyConsentRevokedAt"] as const) if (body[key] !== undefined) update[key] = body[key];
    if (update.contentCategory === "user_testimony" && update.testimonyConsentStatus === undefined) update.testimonyConsentStatus = current.testimonyConsentStatus === "not_applicable" ? "pending" : current.testimonyConsentStatus;
    return MoonwitnessSignalModel.query().where({ id, tenant_id: request.tenantId! }).patch(update);
  });
}
