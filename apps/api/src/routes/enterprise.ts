import { randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  AuditLogModel, CalendarActivityModel, CatalogItemModel, CrmOpportunityModel, OperationalExpenseModel,
  OperationalInvoiceModel, OperationalPaymentModel, PartnerModel, ProjectModel, TaskModel, SalesOrderModel, SalesOrderLineModel, SalesQuoteLineModel,
  SalesQuoteModel, TenantMembershipModel,
} from "@empire/batteries-base";
import { getDatabase } from "@empire/batteries";
import { requirePermission, requireSession } from "./auth.js";
import { requireTenant } from "./tenant-context.js";

const idPattern = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const isId = (value: unknown): value is string => typeof value === "string" && idPattern.test(value);
const isText = (value: unknown, max = 5000): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const isMoney = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000_000;
const isDate = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
const onlyKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((key) => keys.includes(key));
const isCurrency = (value: unknown) => typeof value === "string" && /^[A-Z]{3}$/.test(value);
const tenant = (request: FastifyRequest) => request.tenantId!;
const invalid = (reply: FastifyReply, message = "Data tidak valid.") => reply.code(400).send({ status: "invalid_request", message });
const page = (value: unknown) => Math.max(1, Number(value) || 1);
const limit = (value: unknown) => Math.min(100, Math.max(1, Number(value) || 20));

async function partnerInTenant(id: unknown, tenantId: string) {
  return isId(id) ? PartnerModel.query().where({ id, tenant_id: tenantId }).first() : null;
}
async function audit(request: FastifyRequest, action: string, entity: string, entityId: string, data: Record<string, unknown> = {}) {
  await AuditLogModel.query().insert({ userId: request.authUser!.id, action, entity, entityId, payload: { ...data, tenantId: tenant(request) }, ipAddress: request.ip });
}

export async function enterpriseRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requirePermission("work:read"));
  app.addHook("preHandler", requireTenant);

  app.get("/v1/business/partners", async (request) =>
    PartnerModel.query().where({ tenant_id: tenant(request) }).select("id", "name", "company_name", "email").orderBy("name", "asc").limit(200),
  );

  app.get("/v1/crm/opportunities", async (request) => {
    const q = request.query as { stage?: string; partnerId?: string; page?: string; limit?: string };
    let rows = CrmOpportunityModel.query().where({ tenant_id: tenant(request) }).orderBy("created_at", "desc");
    if (q.stage) rows = rows.where({ stage: q.stage });
    if (q.partnerId && isId(q.partnerId)) rows = rows.where({ partner_id: q.partnerId });
    return rows.paginate({ page: page(q.page), limit: limit(q.limit) });
  });
  app.post("/v1/crm/opportunities", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !onlyKeys(b, ["partnerId", "title", "stage", "amount", "currency", "probability", "expectedCloseAt", "source", "notes"]) || !isId(b.partnerId) || !isText(b.title, 300) || b.stage !== undefined && !["qualified", "proposal", "negotiation", "won", "lost"].includes(b.stage as string) || b.amount !== undefined && !isMoney(b.amount) || b.currency !== undefined && !isCurrency(b.currency) || b.probability !== undefined && (!Number.isInteger(b.probability) || (b.probability as number) < 0 || (b.probability as number) > 100) || b.expectedCloseAt != null && !isDate(b.expectedCloseAt) || b.source != null && !isText(b.source, 200) || b.notes != null && !isText(b.notes)) return invalid(reply);
    if (!await partnerInTenant(b.partnerId, tenant(request))) return invalid(reply, "Partner harus berasal dari tenant aktif.");
    const row = await (CrmOpportunityModel.query() as any).insert({ tenantId: tenant(request), partnerId: b.partnerId, title: b.title.trim(), stage: b.stage ?? "qualified", amount: b.amount ?? 0, currency: b.currency ?? "IDR", probability: b.probability ?? 0, expectedCloseAt: b.expectedCloseAt ?? null, ownerId: request.authUser!.id, source: b.source ?? null, notes: b.notes ?? null });
    await audit(request, "CRM_OPPORTUNITY_CREATED", "crm_opportunity", row.id);
    return reply.code(201).send(row);
  });
  app.patch<{ Params: { id: string } }>("/v1/crm/opportunities/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    const allowed = ["title", "stage", "amount", "currency", "probability", "expectedCloseAt", "source", "notes"];
    if (!b || !Object.keys(b).length || Object.keys(b).some((key) => !allowed.includes(key)) || b.title !== undefined && !isText(b.title, 300) || b.stage !== undefined && !["qualified", "proposal", "negotiation", "won", "lost"].includes(b.stage as string) || b.amount !== undefined && !isMoney(b.amount) || b.currency !== undefined && !isCurrency(b.currency) || b.probability !== undefined && (!Number.isInteger(b.probability) || (b.probability as number) < 0 || (b.probability as number) > 100) || b.expectedCloseAt != null && !isDate(b.expectedCloseAt) || b.source != null && !isText(b.source, 200) || b.notes != null && !isText(b.notes)) return invalid(reply);
    const row = await CrmOpportunityModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!row) return reply.code(404).send({ status: "not_found" });
    const updated = await (row.$query() as any).patchAndFetch({ ...b, ...(b.title ? { title: (b.title as string).trim() } : {}) });
    await audit(request, "CRM_OPPORTUNITY_UPDATED", "crm_opportunity", row.id, { fields: Object.keys(b) });
    return updated;
  });

  app.get("/v1/catalog/items", async (request) => {
    const q = request.query as { search?: string; active?: string; page?: string; limit?: string };
    let rows = CatalogItemModel.query().where({ tenant_id: tenant(request) }).orderBy("name", "asc");
    if (q.active === "true" || q.active === "false") rows = rows.where({ active: q.active === "true" });
    if (q.search?.trim()) rows = rows.search(["name", "sku", "description"], q.search.trim());
    return rows.paginate({ page: page(q.page), limit: limit(q.limit) });
  });
  app.post("/v1/catalog/items", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !onlyKeys(b, ["sku", "name", "kind", "description", "unit", "unitPrice", "currency", "taxRate"]) || !isText(b.sku, 100) || !isText(b.name, 300) || b.kind !== undefined && !["product", "service"].includes(b.kind as string) || b.unitPrice !== undefined && !isMoney(b.unitPrice) || b.currency !== undefined && !isCurrency(b.currency) || b.description != null && !isText(b.description, 10000) || b.unit != null && !isText(b.unit, 30) || b.taxRate !== undefined && (typeof b.taxRate !== "number" || !Number.isFinite(b.taxRate) || b.taxRate < 0 || b.taxRate > 100)) return invalid(reply);
    try {
      const item = await (CatalogItemModel.query() as any).insert({ tenantId: tenant(request), sku: b.sku.trim(), name: b.name.trim(), kind: b.kind ?? "service", description: b.description ?? null, unit: b.unit ?? "unit", unitPrice: b.unitPrice ?? 0, currency: b.currency ?? "IDR", taxRate: b.taxRate ?? 0, active: true });
      await audit(request, "CATALOG_ITEM_CREATED", "catalog_item", item.id);
      return reply.code(201).send(item);
    } catch (error) { if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "SKU sudah digunakan tenant ini." }); throw error; }
  });
  app.patch<{ Params: { id: string } }>("/v1/catalog/items/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    const allowed = ["name", "kind", "description", "unit", "unitPrice", "currency", "taxRate", "active"];
    if (!b || !Object.keys(b).length || !onlyKeys(b, allowed) || b.name !== undefined && !isText(b.name, 300) || b.kind !== undefined && !["product", "service"].includes(b.kind as string) || b.description != null && !isText(b.description, 10000) || b.unit != null && !isText(b.unit, 30) || b.unitPrice !== undefined && !isMoney(b.unitPrice) || b.currency !== undefined && !isCurrency(b.currency) || b.taxRate !== undefined && (typeof b.taxRate !== "number" || !Number.isFinite(b.taxRate) || b.taxRate < 0 || b.taxRate > 100) || b.active !== undefined && typeof b.active !== "boolean") return invalid(reply);
    const item = await CatalogItemModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!item) return reply.code(404).send({ status: "not_found" });
    const updated = await (item.$query() as any).patchAndFetch(b);
    await audit(request, "CATALOG_ITEM_UPDATED", "catalog_item", item.id, { fields: Object.keys(b) });
    return updated;
  });

  app.get("/v1/sales/quotes", async (request) => {
    const q = request.query as { status?: string; page?: string; limit?: string };
    let rows = SalesQuoteModel.query().where({ tenant_id: tenant(request) }).orderBy("created_at", "desc");
    if (q.status) rows = rows.where({ status: q.status });
    return rows.paginate({ page: page(q.page), limit: limit(q.limit) });
  });
  app.get<{ Params: { id: string } }>("/v1/sales/quotes/:id", async (request, reply) => {
    const quote = await SalesQuoteModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!quote) return reply.code(404).send({ status: "not_found" });
    const lines = await SalesQuoteLineModel.query().where({ quote_id: quote.id, tenant_id: tenant(request) }).orderBy("created_at", "asc");
    return { ...quote, lines };
  });
  app.post("/v1/sales/quotes", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !onlyKeys(b, ["partnerId", "opportunityId", "currency", "validUntil", "notes", "lines"]) || !isId(b.partnerId) || b.opportunityId != null && !isId(b.opportunityId) || b.currency !== undefined && !isCurrency(b.currency) || b.validUntil != null && !isDate(b.validUntil) || b.notes != null && !isText(b.notes) || !Array.isArray(b.lines) || !b.lines.length || b.lines.length > 100 || b.lines.some((x) => !x || typeof x !== "object" || !onlyKeys(x as Record<string, unknown>, ["description", "catalogItemId", "quantity", "unitPrice", "taxRate"]) || (x as Record<string, unknown>).catalogItemId != null && !isId((x as Record<string, unknown>).catalogItemId) || !isText((x as Record<string, unknown>).description, 500) || !isMoney((x as Record<string, unknown>).quantity) || (x as Record<string, unknown>).quantity === 0 || !isMoney((x as Record<string, unknown>).unitPrice) || (x as Record<string, unknown>).taxRate !== undefined && (typeof (x as Record<string, unknown>).taxRate !== "number" || ((x as Record<string, unknown>).taxRate as number) < 0 || ((x as Record<string, unknown>).taxRate as number) > 100))) return invalid(reply);
    if (!await partnerInTenant(b.partnerId, tenant(request))) return invalid(reply, "Partner harus berasal dari tenant aktif.");
    if (b.opportunityId != null && !await CrmOpportunityModel.query().where({ id: b.opportunityId, tenant_id: tenant(request) }).first()) return invalid(reply, "Peluang harus berasal dari tenant aktif.");
    const lines = b.lines as Array<Record<string, unknown>>;
    const normalized = lines.map((line) => { const base = Number(line.quantity) * Number(line.unitPrice); const tax = Number(line.taxRate ?? 0); return { tenantId: tenant(request), description: (line.description as string).trim(), catalogItemId: isId(line.catalogItemId) ? line.catalogItemId : null, quantity: line.quantity, unitPrice: line.unitPrice, taxRate: tax, lineTotal: Number((base + base * tax / 100).toFixed(4)) }; });
    if (normalized.some((line) => line.catalogItemId === null && lines[normalized.indexOf(line)]?.catalogItemId != null)) return invalid(reply, "Item katalog tidak valid.");
    const subtotal = Number(normalized.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unitPrice), 0).toFixed(4));
    const total = Number(normalized.reduce((sum, line) => sum + Number(line.lineTotal), 0).toFixed(4));
    const db = getDatabase();
    const result = await db.transaction(async (trx) => {
      for (const line of normalized) if (line.catalogItemId) { const item = await CatalogItemModel.query(trx).where({ id: line.catalogItemId, tenant_id: tenant(request), active: true }).first(); if (!item || item.currency !== (b.currency ?? "IDR")) throw new Error("CATALOG_ITEM_INVALID"); }
      const number = `Q-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
      const quote = await (SalesQuoteModel.query(trx) as any).insert({ tenantId: tenant(request), partnerId: b.partnerId, opportunityId: b.opportunityId ?? null, number, status: "draft", currency: b.currency ?? "IDR", subtotal, taxTotal: total - subtotal, total, validUntil: b.validUntil ?? null, notes: b.notes ?? null, createdBy: request.authUser!.id });
      for (const line of normalized) await (SalesQuoteLineModel.query(trx) as any).insert({ ...line, quoteId: quote.id });
      return quote;
    }).catch((error) => { if ((error as Error).message === "CATALOG_ITEM_INVALID") return null; throw error; });
    if (!result) return invalid(reply, "Item katalog harus aktif dan berada di tenant ini.");
    await audit(request, "SALES_QUOTE_CREATED", "sales_quote", result.id, { total });
    return reply.code(201).send({ ...result, lines: normalized });
  });
  app.post<{ Params: { id: string } }>("/v1/sales/quotes/:id/transition", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const transition = request.body as Record<string, unknown>;
    if (!transition || !onlyKeys(transition, ["status"])) return invalid(reply, "Perubahan quote tidak valid.");
    const { status } = transition as { status?: string };
    if (!["sent", "accepted", "rejected", "expired"].includes(status ?? "")) return invalid(reply, "Status quote tidak valid.");
    const quote = await SalesQuoteModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!quote) return reply.code(404).send({ status: "not_found" });
    if (quote.status === "draft" && status !== "sent" || quote.status === "sent" && !["accepted", "rejected", "expired"].includes(status!) || quote.status !== "draft" && quote.status !== "sent") return reply.code(409).send({ status: "invalid_transition", message: "Perubahan status quote tidak diperbolehkan." });
    const db = getDatabase();
    const result = await db.transaction(async (trx) => {
      const lockedQuote = await SalesQuoteModel.query(trx).where({ id: quote.id, tenant_id: tenant(request) }).forUpdate().first();
      if (!lockedQuote || lockedQuote.status !== quote.status) throw new Error("QUOTE_CHANGED");
      const updatedQuote = await (lockedQuote.$query(trx) as any).patchAndFetch({ status });
      if (status !== "accepted") return { quote: updatedQuote, orderId: null as string | null, lineCount: 0 };
      const lines = await SalesQuoteLineModel.query(trx).where({ tenant_id: tenant(request), quote_id: quote.id });
      const order = await (SalesOrderModel.query(trx) as any).insert({ tenantId: tenant(request), quoteId: quote.id, partnerId: quote.partnerId, number: quote.number.replace(/^Q-/, "SO-"), status: "confirmed", currency: quote.currency, subtotal: quote.subtotal, taxTotal: quote.taxTotal, total: quote.total, orderedAt: new Date().toISOString(), notes: quote.notes });
      for (const line of lines) await (SalesOrderLineModel.query(trx) as any).insert({ tenantId: tenant(request), orderId: order.id, catalogItemId: line.catalogItemId, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, taxRate: line.taxRate, lineTotal: line.lineTotal });
      return { quote: updatedQuote, orderId: order.id as string, lineCount: lines.length };
    }).catch((error) => { if ((error as Error).message === "QUOTE_CHANGED") return null; throw error; });
    if (!result) return reply.code(409).send({ status: "conflict", message: "Quote sudah berubah; muat ulang sebelum mencoba lagi." });
    if (result.orderId) await audit(request, "SALES_ORDER_CREATED", "sales_order", result.orderId, { quoteId: quote.id, lineCount: result.lineCount });
    await audit(request, "SALES_QUOTE_TRANSITIONED", "sales_quote", quote.id, { status });
    return result.quote;
  });

  app.get("/v1/sales/orders", async (request) => {
    const q = request.query as { page?: string; limit?: string };
    return SalesOrderModel.query().where({ tenant_id: tenant(request) }).orderBy("ordered_at", "desc").paginate({ page: page(q.page), limit: limit(q.limit) });
  });
  app.get<{ Params: { id: string } }>("/v1/sales/orders/:id", async (request, reply) => {
    const order = await SalesOrderModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!order) return reply.code(404).send({ status: "not_found" });
    const lines = await SalesOrderLineModel.query().where({ order_id: order.id, tenant_id: tenant(request) }).orderBy("created_at", "asc");
    return { ...order, lines };
  });
  app.get("/v1/finance/invoices", async (request) => {
    const q = request.query as { status?: string; page?: string; limit?: string };
    let rows = OperationalInvoiceModel.query().where({ tenant_id: tenant(request) }).orderBy("issued_at", "desc");
    if (q.status) rows = rows.where({ status: q.status });
    return rows.paginate({ page: page(q.page), limit: limit(q.limit) });
  });
  app.get<{ Params: { id: string } }>("/v1/finance/invoices/:id", async (request, reply) => {
    const invoice = await OperationalInvoiceModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!invoice) return reply.code(404).send({ status: "not_found" });
    const payments = await OperationalPaymentModel.query().where({ invoice_id: invoice.id, tenant_id: tenant(request) }).orderBy("paid_at", "desc");
    return { ...invoice, payments };
  });
  app.post("/v1/finance/invoices", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !onlyKeys(b, ["partnerId", "orderId", "number", "amount", "currency", "dueAt", "notes"]) || !isId(b.partnerId) || b.orderId != null && !isId(b.orderId) || !isText(b.number, 100) || !isMoney(b.amount) || b.amount === 0 || b.currency !== undefined && !isCurrency(b.currency) || b.dueAt != null && !isDate(b.dueAt) || b.notes != null && !isText(b.notes)) return invalid(reply);
    if (!await partnerInTenant(b.partnerId, tenant(request))) return invalid(reply, "Partner harus berasal dari tenant aktif.");
    if (b.orderId != null) { const order = await SalesOrderModel.query().where({ id: b.orderId, tenant_id: tenant(request), partner_id: b.partnerId as string }).first(); if (!order) return invalid(reply, "Pesanan harus berasal dari tenant ini dan partner yang sama."); }
    try {
      const invoice = await (OperationalInvoiceModel.query() as any).insert({ tenantId: tenant(request), partnerId: b.partnerId, orderId: b.orderId ?? null, number: b.number.trim(), status: "issued", currency: b.currency ?? "IDR", amount: b.amount, paidAmount: 0, issuedAt: new Date().toISOString(), dueAt: b.dueAt ?? null, notes: b.notes ?? null });
      await audit(request, "INVOICE_ISSUED", "operational_invoice", invoice.id, { amount: invoice.amount });
      return reply.code(201).send(invoice);
    } catch (error) { if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict", message: "Nomor invoice sudah digunakan." }); throw error; }
  });
  app.post<{ Params: { id: string } }>("/v1/finance/invoices/:id/payments", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !onlyKeys(b, ["amount", "method", "reference", "paidAt", "notes"]) || !isMoney(b.amount) || b.amount === 0 || !isText(b.method, 100) || b.reference != null && !isText(b.reference, 200) || b.paidAt != null && !isDate(b.paidAt) || b.notes != null && !isText(b.notes)) return invalid(reply);
    const db = getDatabase();
    const outcome = await db.transaction(async (trx) => {
      const invoice = await OperationalInvoiceModel.query(trx).where({ id: request.params.id, tenant_id: tenant(request) }).forUpdate().first();
      if (!invoice || ["paid", "void"].includes(invoice.status)) return null;
      const current = Number(invoice.paidAmount ?? 0);
      if (Number(b.amount) > Number(invoice.amount) - current) return "OVERPAY";
      const payment = await (OperationalPaymentModel.query(trx) as any).insert({ tenantId: tenant(request), invoiceId: invoice.id, amount: b.amount, currency: invoice.currency, method: b.method, reference: b.reference ?? null, paidAt: b.paidAt ?? new Date().toISOString(), notes: b.notes ?? null, recordedBy: request.authUser!.id });
      const paidAmount = current + Number(b.amount);
      await (invoice.$query(trx) as any).patch({ paidAmount, status: paidAmount >= Number(invoice.amount) ? "paid" : "partially_paid" });
      return payment;
    });
    if (!outcome) return reply.code(404).send({ status: "not_found" });
    if (outcome === "OVERPAY") return reply.code(409).send({ status: "overpayment", message: "Pembayaran melebihi sisa tagihan." });
    await audit(request, "INVOICE_PAYMENT_RECORDED", "operational_invoice", request.params.id, { amount: b.amount });
    return reply.code(201).send(outcome);
  });
  app.get("/v1/finance/expenses", async (request) => {
    const q = request.query as { page?: string; limit?: string; status?: string };
    let rows = OperationalExpenseModel.query().where({ tenant_id: tenant(request) }).orderBy("incurred_at", "desc");
    if (q.status) rows = rows.where({ status: q.status });
    return rows.paginate({ page: page(q.page), limit: limit(q.limit) });
  });
  app.post("/v1/finance/expenses", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !onlyKeys(b, ["partnerId", "category", "description", "amount", "currency", "incurredAt", "notes"]) || b.partnerId != null && !isId(b.partnerId) || !isText(b.category, 120) || !isText(b.description, 500) || !isMoney(b.amount) || b.amount === 0 || b.currency !== undefined && !isCurrency(b.currency) || !isDate(b.incurredAt) || b.notes != null && !isText(b.notes)) return invalid(reply);
    if (b.partnerId != null && !await partnerInTenant(b.partnerId, tenant(request))) return invalid(reply, "Partner harus berasal dari tenant aktif.");
    const expense = await (OperationalExpenseModel.query() as any).insert({ tenantId: tenant(request), partnerId: b.partnerId ?? null, category: b.category.trim(), description: b.description.trim(), amount: b.amount, currency: b.currency ?? "IDR", incurredAt: b.incurredAt, status: "recorded", receiptDocumentId: null, recordedBy: request.authUser!.id, notes: b.notes ?? null });
    await audit(request, "EXPENSE_RECORDED", "operational_expense", expense.id, { amount: expense.amount });
    return reply.code(201).send(expense);
  });

  app.get("/v1/activities", async (request) => {
    const q = request.query as { from?: string; to?: string; page?: string; limit?: string };
    let rows = CalendarActivityModel.query().where({ tenant_id: tenant(request) }).orderBy("starts_at", "asc");
    if (q.from && isDate(q.from)) rows = rows.where("starts_at", ">=", q.from);
    if (q.to && isDate(q.to)) rows = rows.where("starts_at", "<=", q.to);
    return rows.paginate({ page: page(q.page), limit: limit(q.limit) });
  });
  app.post("/v1/activities", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || !onlyKeys(b, ["partnerId", "opportunityId", "projectId", "taskId", "ownerId", "title", "kind", "status", "startsAt", "endsAt", "location", "notes"]) || !isText(b.title, 300) || !isDate(b.startsAt) || b.endsAt != null && !isDate(b.endsAt) || ["partnerId", "opportunityId", "projectId", "taskId", "ownerId"].some((key) => b[key] != null && !isId(b[key])) || b.location != null && !isText(b.location, 500) || b.notes != null && !isText(b.notes) || b.kind !== undefined && !["meeting", "call", "email", "reminder", "other"].includes(b.kind as string) || b.status !== undefined && !["planned", "done", "cancelled"].includes(b.status as string)) return invalid(reply);
    if (b.endsAt && Date.parse(b.endsAt as string) < Date.parse(b.startsAt as string)) return invalid(reply, "Waktu selesai harus setelah waktu mulai.");
    if (b.partnerId != null && !await partnerInTenant(b.partnerId, tenant(request))) return invalid(reply, "Partner harus berasal dari tenant aktif.");
    if (b.ownerId != null) { const membership = await TenantMembershipModel.query().where({ tenant_id: tenant(request), user_id: b.ownerId, status: "active" }).first(); if (!membership) return invalid(reply, "Pemilik aktivitas harus anggota aktif tenant ini."); }
    if (b.opportunityId != null && !await CrmOpportunityModel.query().where({ id: b.opportunityId, tenant_id: tenant(request) }).first()) return invalid(reply, "Peluang harus berasal dari tenant aktif.");
    if (b.projectId != null && !await ProjectModel.query().where({ id: b.projectId, tenant_id: tenant(request) }).first()) return invalid(reply, "Project harus berasal dari tenant aktif.");
    if (b.taskId != null) {
      const task = await TaskModel.query().where({ id: b.taskId, tenant_id: tenant(request) }).first();
      if (!task || b.projectId != null && task.projectId !== b.projectId) return invalid(reply, "Task harus berasal dari tenant aktif dan project yang dipilih.");
    }
    const activity = await (CalendarActivityModel.query() as any).insert({ tenantId: tenant(request), partnerId: b.partnerId ?? null, opportunityId: b.opportunityId ?? null, projectId: b.projectId ?? null, taskId: b.taskId ?? null, ownerId: b.ownerId ?? request.authUser!.id, title: b.title.trim(), kind: b.kind ?? "meeting", status: b.status ?? "planned", startsAt: b.startsAt, endsAt: b.endsAt ?? null, location: b.location ?? null, notes: b.notes ?? null, completedAt: b.status === "done" ? new Date().toISOString() : null });
    await audit(request, "ACTIVITY_CREATED", "calendar_activity", activity.id);
    return reply.code(201).send(activity);
  });
  app.patch<{ Params: { id: string } }>("/v1/activities/:id", { preHandler: requirePermission("work:write") }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (!b || Object.keys(b).some((key) => !["status", "notes", "location", "startsAt", "endsAt"].includes(key)) || !Object.keys(b).length || b.status !== undefined && !["planned", "done", "cancelled"].includes(b.status as string) || b.startsAt !== undefined && !isDate(b.startsAt) || b.endsAt != null && !isDate(b.endsAt) || b.location != null && !isText(b.location, 500) || b.notes != null && !isText(b.notes)) return invalid(reply);
    const activity = await CalendarActivityModel.query().where({ id: request.params.id, tenant_id: tenant(request) }).first();
    if (!activity) return reply.code(404).send({ status: "not_found" });
    const startsAt = b.startsAt ?? activity.startsAt;
    const endsAt = b.endsAt === undefined ? activity.endsAt : b.endsAt;
    if (endsAt && Date.parse(endsAt as string) < Date.parse(startsAt as string)) return invalid(reply, "Waktu selesai harus setelah waktu mulai.");
    const updated = await (activity.$query() as any).patchAndFetch({ ...b, ...(b.status === "done" ? { completedAt: new Date().toISOString() } : b.status === "planned" ? { completedAt: null } : {}) });
    await audit(request, "ACTIVITY_UPDATED", "calendar_activity", activity.id, { fields: Object.keys(b) });
    return updated;
  });
}
