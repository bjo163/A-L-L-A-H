import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { getDatabase } from "@empire/batteries";
import { AuditLogModel, DocumentModel } from "@empire/batteries-base";
import { env } from "../env.js";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

function storageRoot() { return resolve(env.FILE_STORAGE_DIR); }
function filePath(key: string) {
  if (key.includes("\\") || key.startsWith("/") || key.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Invalid storage key.");
  const root = storageRoot();
  const result = resolve(root, key);
  if (!result.startsWith(`${root}${sep}`)) throw new Error("Invalid storage path.");
  return result;
}
function signature(tenantId: string, documentId: string, expires: string, key: string, classification: string) {
  return createHmac("sha256", env.FILE_STORAGE_SIGNING_SECRET).update(`${tenantId}:${documentId}:${expires}:${key}:${classification}`).digest("hex");
}
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function documentStorageRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>("/v1/documents/:id/content", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    preHandler: [requireSession, requirePermission("work:write"), requireTenant],
  }, async (request, reply) => {
    const doc = await DocumentModel.query().where({ id: request.params.id, tenant_id: request.tenantId!, status: "active" }).first();
    if (!doc) return reply.code(404).send({ status: "not_found", message: "Dokumen tidak ditemukan." });
    if (doc.storageProvider === "local-private" && doc.storageKey !== "pending") return reply.code(409).send({ status: "conflict", message: "Dokumen sudah memiliki berkas; buat record dokumen baru untuk versi lain." });
    if (!Buffer.isBuffer(request.body) || !request.body.length || request.body.length > 25 * 1024 * 1024) return reply.code(400).send({ status: "invalid_request", message: "File harus berisi 1 byte sampai 25 MiB." });
    const key = `${request.tenantId}/${randomUUID()}`;
    const path = filePath(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const bytes = request.body;
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
    try {
      const db = getDatabase();
      const updated = await db.transaction(async (trx) => {
        const current = await DocumentModel.query(trx).where({ id: doc.id, tenant_id: request.tenantId!, status: "active" }).first();
        if (!current) throw new Error("Document changed while upload was in progress.");
        const row = await (current.$query(trx) as any).patchAndFetch({ storageProvider: "local-private", storageKey: key, sizeBytes: bytes.length, sha256 });
        await AuditLogModel.query(trx).insert({ userId: request.authUser!.id, action: "DOCUMENT_CONTENT_UPLOADED", entity: "document", entityId: doc.id, payload: { tenantId: request.tenantId, sizeBytes: bytes.length, sha256 }, ipAddress: request.ip });
        return row;
      });
      return { document: updated, sha256, sizeBytes: bytes.length };
    } catch (error) {
      await rm(path, { force: true });
      throw error;
    }
  });

  app.post<{ Params: { id: string } }>("/v1/documents/:id/download-link", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    preHandler: [requireSession, requirePermission("work:read"), requireTenant],
  }, async (request, reply) => {
    if (env.FILE_STORAGE_SIGNING_SECRET.length < 32) return reply.code(503).send({ status: "unavailable", message: "Konfigurasi signing secret harus berisi sedikitnya 32 karakter." });
    const doc = await DocumentModel.query().where({ id: request.params.id, tenant_id: request.tenantId!, status: "active" }).first();
    if (!doc) return reply.code(404).send({ status: "not_found", message: "Dokumen tidak ditemukan." });
    if (doc.classification === "restricted" && !request.authUser!.sovereign) return reply.code(403).send({ status: "forbidden", message: "Hanya administrator tenant yang dapat membuat tautan dokumen terbatas." });
    if (doc.storageProvider !== "local-private" || !doc.storageKey) return reply.code(409).send({ status: "storage_unavailable", message: "Berkas ini belum tersimpan pada provider privat yang didukung." });
    const expires = String(Math.floor(Date.now() / 1000) + 10 * 60);
    const sig = signature(doc.tenantId!, doc.id, expires, doc.storageKey, doc.classification);
    return { url: `/v1/documents/${encodeURIComponent(doc.id)}/content?expires=${expires}&signature=${sig}`, expiresAt: new Date(Number(expires) * 1000).toISOString() };
  });

  app.get<{ Params: { id: string }; Querystring: { expires?: string; signature?: string } }>("/v1/documents/:id/content", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    schema: { security: [] },
  }, async (request, reply) => {
    const { expires, signature: supplied } = request.query;
    if (env.FILE_STORAGE_SIGNING_SECRET.length < 32 || !expires || !/^\d{10}$/.test(expires) || Number(expires) < Math.floor(Date.now() / 1000) || !supplied || !/^[a-f0-9]{64}$/.test(supplied)) return reply.code(401).send({ status: "unauthorized", message: "Tautan unduh tidak valid atau kedaluwarsa." });
    const doc = uuid(request.params.id) ? await DocumentModel.query().where({ id: request.params.id, status: "active", storage_provider: "local-private" }).first() : null;
    if (!doc?.storageKey || !doc.tenantId) return reply.code(404).send({ status: "not_found", message: "Dokumen tidak ditemukan." });
    const expected = Buffer.from(signature(doc.tenantId, doc.id, expires, doc.storageKey, doc.classification), "hex");
    const actual = Buffer.from(supplied, "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return reply.code(401).send({ status: "unauthorized", message: "Tautan unduh tidak valid atau kedaluwarsa." });
    let bytes: Buffer;
    try { bytes = await readFile(filePath(doc.storageKey)); }
    catch { return reply.code(404).send({ status: "not_found", message: "Berkas tidak ditemukan." }); }
    if (bytes.length !== Number(doc.sizeBytes) || createHash("sha256").update(bytes).digest("hex") !== doc.sha256.toLowerCase()) return reply.code(500).send({ status: "integrity_error", message: "Pemeriksaan integritas berkas gagal." });
    const safeName = doc.fileName.replace(/[\r\n"\\]/g, "_");
    return reply.type(doc.mediaType || "application/octet-stream").header("content-length", String(bytes.length)).header("content-disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`).header("x-content-type-options", "nosniff").header("cache-control", "private, no-store").send(bytes);
  });
}
