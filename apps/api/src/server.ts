import cors from "@fastify/cors";
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
import { continuumRoutes } from "./routes/continuum.js";
import { authRoutes } from "./routes/auth.js";
import { cabRoutes } from "./routes/cab.js";
import { empireCompatibilityRoutes } from "./routes/empire-compat.js";
import { researchRoutes } from "./routes/research.js";
import { worldMonitorRoutes } from "./routes/world-monitor.js";
import { startWorldMonitorScheduler } from "./world-monitor-scheduler.js";
import { startYoutubeSentinelScheduler } from "./youtube-sentinel-scheduler.js";

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

    stage = "module-and-dna-preload";
    const modulePlan = await loadModulePlan();
    console.info(`[API startup] Resolved ${modulePlan.catalog.length} platform modules.`);
    console.info(
      `[DNA fusion] Preloaded ${modulePlan.dnaFusion.preload.loadedCount}/${modulePlan.dnaFusion.preload.expectedCount} package manifests as metadata.`,
    );

    stage = "http-app-initialization";
    app = Fastify({
      logger: {
        level: env.NODE_ENV === "production" ? "info" : "debug",
      },
    });
    let stopWorldMonitorScheduler: (() => void) | undefined;
    let stopYoutubeSentinelScheduler: (() => void) | undefined;

    app.addHook("onClose", async () => {
      await closeDatabase();
      stopWorldMonitorScheduler?.();
      stopYoutubeSentinelScheduler?.();
    });
    app.decorateRequest("authUser", null);
    app.decorateRequest("authSession", null);

    app.addHook("onRoute", (route) => {
      const publicRoutes = new Set([
        "/",
        "/health",
        "/v1/health",
        "/v1/readiness",
        "/v1/modules",
        "/v1/dna/fusion",
        "/v1/metadata/capabilities",
        "/v1/world-monitor",
        "/v1/world-monitor/youtube",
        "/v1/world-monitor/youtube/scan",
        "/v1/world-monitor/youtube/action",
        "/v1/world-monitor/youtube/snippet",
        "/auth/login",
        "/openapi.json",
      ]);

      route.schema ??= {};
      route.schema.security = publicRoutes.has(route.url) ? [] : [{ bearerAuth: [] }];
      if (!route.schema.tags) {
        route.schema.tags = route.url.startsWith("/continuum/cab/")
          ? ["CAB"]
          : route.url.startsWith("/auth/")
            ? ["Auth"]
            : route.url.startsWith("/v1/research-runs")
              ? ["Research"]
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
          { name: "System", description: "Health and module metadata" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "opaque session token" },
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
        dnaFusion: "/v1/dna/fusion",
      },
    }));

    await app.register(healthRoutes);
    await app.register(empireCompatibilityRoutes);
    await app.register(authRoutes);
    await app.register(userRoutes);
    await app.register(continuumRoutes);
    const enabledIds = new Set(modulePlan.enabled.map((module) => module.id));
    if (enabledIds.has("governance")) await app.register(cabRoutes);
    if (enabledIds.has("research")) await app.register(researchRoutes);
    await app.register(worldMonitorRoutes);
    await app.ready();

    stopWorldMonitorScheduler = startWorldMonitorScheduler();
    stopYoutubeSentinelScheduler = startYoutubeSentinelScheduler();

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
