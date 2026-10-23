import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { fileURLToPath } from "node:url";
import { runAdabScanner, syncBaseModule } from "@empire/batteries-base";

import { env } from "./env.js";
import { initApiDatabase, closeDatabase } from "./db.js";
import { getDatabase } from "@empire/batteries";
import { loadModulePlan } from "./module-runtime.js";
import { healthRoutes } from "./routes/health.js";
import { userRoutes } from "./routes/users.js";
import { partnerRoutes } from "./routes/partners.js";
import { continuumRoutes } from "./routes/continuum.js";
import { authRoutes } from "./routes/auth.js";
import { cabRoutes } from "./routes/cab.js";
import { empireCompatibilityRoutes } from "./routes/empire-compat.js";
import { researchRoutes } from "./routes/research.js";
import { workRoutes } from "./routes/work.js";
import { enterpriseRoutes } from "./routes/enterprise.js";
import { collaborationRoutes } from "./routes/collaboration.js";
import { documentStorageRoutes } from "./routes/document-storage.js";
import { tenantMembershipRoutes } from "./routes/tenant-memberships.js";
import { worldMonitorRoutes } from "./routes/world-monitor.js";
import { startWorldMonitorScheduler } from "./world-monitor-scheduler.js";
import { startYoutubeSentinelScheduler } from "./youtube-sentinel-scheduler.js";
import { startNotificationOutboxWorker } from "./collaboration-outbox.js";
import { createRequestId } from "./request-id.js";

export async function buildServer() {
  let stage = "source-policy-scan";
  let app: FastifyInstance | undefined;

  try {
    console.info("[API startup] Checking API source policy...");
    const apiRoot = fileURLToPath(new URL("../", import.meta.url));
    const report = await runAdabScanner(apiRoot);
    if (!report.passed) {
      for (const violation of report.violations) {
        console.error(
          `[API source policy] ${violation.category} ${violation.file}:${violation.line} — ${violation.guidance}`,
        );
      }
      throw new Error(`API source-policy scan found ${report.violations.length} violation(s).`);
    }
    console.info(
      `[API startup] Source-policy scan passed (${report.scannedFiles} files, ${report.scannedLines} lines).`,
    );

    stage = "module-and-registry-load";
    const modulePlan = await loadModulePlan();
    console.info(`[API startup] Resolved ${modulePlan.catalog.length} platform modules.`);
    console.info(`[DNA registry] Loaded ${modulePlan.dnaRegistry.records.length} metadata records.`);

    stage = "http-app-initialization";
    app = Fastify({
      genReqId: (request) => createRequestId(request.headers["x-request-id"]),
      logger: {
        level: env.NODE_ENV === "production" ? "info" : "debug",
      },
    });
    app.addHook("onSend", async (request, reply, payload) => {
      reply.header("x-request-id", request.id);
      return payload;
    });
    app.addContentTypeParser("application/octet-stream", { parseAs: "buffer", bodyLimit: 25 * 1024 * 1024 }, (_request, body, done) => done(null, body));
    let stopWorldMonitorScheduler: (() => void) | undefined;
    let stopYoutubeSentinelScheduler: (() => void) | undefined;
    let stopNotificationOutboxWorker: (() => Promise<void>) | undefined;

    app.addHook("onClose", async () => {
      await stopNotificationOutboxWorker?.();
      await closeDatabase();
      stopWorldMonitorScheduler?.();
      stopYoutubeSentinelScheduler?.();
    });
    app.decorateRequest("authUser", null);
    app.decorateRequest("authSession", null);
    app.decorateRequest("tenantId", null);

    app.addHook("onRoute", (route) => {
      const publicRoutes = new Set([
        "/",
        "/health",
        "/v1/health",
        "/v1/readiness",
        "/v1/modules",
        "/v1/dna/registry",
        "/v1/metadata/capabilities",
        "/v1/world-monitor",
        "/v1/world-monitor/youtube/snippet",
        "/auth/login",
        "/openapi.json",
      ]);

      route.schema ??= {};
      route.schema.security = publicRoutes.has(route.url) || route.url === "/v1/documents/:id/content" ? [] : [{ bearerAuth: [] }];
      if (!route.schema.tags) {
        route.schema.tags = route.url.startsWith("/continuum/cab/")
          ? ["CAB"]
          : route.url.startsWith("/auth/")
            ? ["Auth"]
            : route.url.startsWith("/v1/research-runs")
              ? ["Research"]
              : route.url.startsWith("/v1/business") || route.url.startsWith("/v1/crm") || route.url.startsWith("/v1/catalog") || route.url.startsWith("/v1/sales") || route.url.startsWith("/v1/finance") || route.url.startsWith("/v1/activities")
                ? ["CRM"]
                : route.url.startsWith("/v1/workspaces") || route.url.startsWith("/v1/projects") || route.url.startsWith("/v1/tasks") || route.url.startsWith("/v1/documents") || route.url.startsWith("/v1/comments") || route.url.startsWith("/v1/tags") || route.url.startsWith("/v1/tag-assignments") || route.url.startsWith("/v1/notifications") || route.url.startsWith("/v1/activity")
                ? ["Work"]
                : route.url.startsWith("/v1/tenant-memberships") || route.url.startsWith("/partners")
                  ? ["Tenancy"]
                  : ["System"];
      }
    });

    stage = "database-initialization-and-schema-sync";
    initApiDatabase();
    await syncBaseModule(getDatabase(), modulePlan.enabled);
    console.info("[API startup] Database connection and enabled-module schema sync completed.");

    stage = "route-registration-and-readiness";
    await app.register(cors, {
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
      exposedHeaders: ["x-request-id"],
    });
    await app.register(rateLimit, {
      max: 600,
      timeWindow: "1 minute",
    });
    await app.register(swagger, {
      openapi: {
        info: {
          title: "Empire of the Light API",
          description: "Canonical API contract for the local Empire operations system.",
          version: "0.2.0",
        },
        tags: [
          { name: "Auth", description: "Operator session authentication" },
          { name: "CAB", description: "Change Advisory Board governance" },
          { name: "Research", description: "Tenant-scoped research workflow and evidence" },
          { name: "Work", description: "Tenant-scoped workspaces, projects, tasks, and document records" },
          { name: "CRM", description: "Tenant-scoped opportunities, catalog, sales, finance, and scheduled activities" },
          { name: "Tenancy", description: "Tenant selection, membership, and partner contacts" },
          { name: "System", description: "Health and module metadata" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "opaque session token" },
            tenantSelection: { type: "apiKey", in: "header", name: "X-Tenant-Id", description: "Required when the authenticated user has multiple active tenant memberships." },
          },
        },
      },
    });

    app.get(
      "/openapi.json",
      { schema: { tags: ["System"], summary: "OpenAPI 3 contract", security: [] } },
      async () => app!.swagger(),
    );
    app.get("/", async () => ({
      service: "empire-api",
      protocol: "Empire of the Light Agentic Continuum",
      documentation: "/continuum",
      sourcePolicyScan: {
        status: "PASSED",
        filesChecked: report.scannedFiles,
        linesChecked: report.scannedLines,
      },
      endpoints: {
        auth: "POST /auth/login",
        continuum: "/continuum",
        agents: "/continuum/agents",
        asma: "/continuum/asma",
        agentInvocation: "POST /continuum/agents/:code/invoke",
        sovereign: "/continuum/sovereign",
        architect: "/continuum/architect",
        chronicles: "/continuum/chronicles",
        health: "/health",
        dnaRegistry: "/v1/dna/registry",
      },
    }));

    await app.register(healthRoutes);
    await app.register(empireCompatibilityRoutes);
    await app.register(authRoutes);
    await app.register(userRoutes);
    await app.register(partnerRoutes);
    await app.register(tenantMembershipRoutes);
    await app.register(continuumRoutes);
    const enabledIds = new Set(modulePlan.enabled.map((module) => module.id));
    if (enabledIds.has("governance")) await app.register(cabRoutes);
    if (enabledIds.has("research")) await app.register(researchRoutes);
    if (enabledIds.has("work")) await app.register(workRoutes);
    if (enabledIds.has("work")) await app.register(enterpriseRoutes);
    if (enabledIds.has("work")) await app.register(collaborationRoutes);
    if (enabledIds.has("work")) await app.register(documentStorageRoutes);
    await app.register(worldMonitorRoutes);
    await app.ready();

    stopWorldMonitorScheduler = startWorldMonitorScheduler();
    stopYoutubeSentinelScheduler = startYoutubeSentinelScheduler();
    stopNotificationOutboxWorker = startNotificationOutboxWorker();

    console.info("[API startup] Routes are ready; server can now listen for requests.");
    return app;
  } catch (error) {
    if (app) {
      try {
        await app.close();
      } catch (closeError) {
        console.error("[API startup] Cleanup after startup failure also failed.", closeError);
      }
    }
    console.error(`[API startup] Failed during ${stage}.`, error);
    throw error;
  }
}

export type App = Awaited<ReturnType<typeof buildServer>>;
