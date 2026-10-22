import type { FastifyInstance } from "fastify";
import { resolveModuleModels } from "@empire/batteries-base";
import { checkDatabaseHealth, checkDatabaseSchema } from "../db.js";
import { loadModulePlan } from "../module-runtime.js";

export async function empireCompatibilityRoutes(app: FastifyInstance) {
  app.get("/v1/health", async () => {
    const database = await checkDatabaseHealth();
    return {
      status: database.ok ? "ok" : "degraded",
      service: "empire-api",
      database,
      uptime: Number(process.uptime().toFixed(3)),
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/v1/readiness", async (_request, reply) => {
    const database = await checkDatabaseHealth();
    const { enabled, dnaFusion } = await loadModulePlan();
    const models = resolveModuleModels(enabled).flatMap((module) => module.models);
    const schema = database.ok
      ? await checkDatabaseSchema(models, enabled)
      : { ok: false, missingTables: [], modules: [], pendingOperations: [], blockers: [] };
    const ready = database.ok && schema.ok;
    return reply.code(ready ? 200 : 503).send({
      status: ready ? "ok" : "degraded",
      checks: {
        database: database.ok ? "ok" : "unavailable",
        schema: schema.ok ? "current" : "module_sync_required",
        identity: "local-session-rbac",
        batteriesDnaFusion: dnaFusion.preload.state,
      },
      dnaFusionPreloaded: dnaFusion.preload.loadedCount,
      missingTables: schema.missingTables,
      pendingSchemaOperations: schema.pendingOperations,
      schemaBlockers: schema.blockers,
      modules: schema.modules,
    });
  });

  app.get("/v1/metadata/capabilities", async () => {
    const { enabled } = await loadModulePlan();
    return {
      capabilities: enabled.flatMap((module) => module.capabilities),
      environment: "LOCAL_SCAFFOLD",
    };
  });

  app.get("/v1/modules", async () => {
    const { catalog, enabled } = await loadModulePlan();
    return {
      items: catalog.map((module) => ({
        id: module.id,
        title: module.title,
        version: module.version,
        state: module.state,
        enabled: enabled.some((item) => item.id === module.id),
      })),
    };
  });

  app.get("/v1/dna/fusion", async () => {
    const { dnaFusion } = await loadModulePlan();
    return {
      fusion: {
        id: dnaFusion.recipe.id,
        name: dnaFusion.recipe.name,
        version: dnaFusion.recipe.version,
        status: dnaFusion.recipe.status,
        loadMode: dnaFusion.recipe.loadMode,
        executionEnabled: dnaFusion.recipe.executionEnabled,
        authorityGranted: dnaFusion.recipe.authorityGranted,
      },
      preload: dnaFusion.preload,
      components: dnaFusion.components.map((component) => ({
        id: component.id,
        packageName: component.packageName,
        number: component.number,
        recordType: component.recordType,
        lexicon: component.lexicon,
        capability: component.projectMapping?.capability ?? null,
        preloadState: component.preloadState,
        runtimeEnabled: component.runtimeEnabled,
      })),
    };
  });
}
