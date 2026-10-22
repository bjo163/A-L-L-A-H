import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  UserModel,
  LegacyDictionaryCompatibilityService,
  AuditLogModel,
  LexiconModel,
} from "@empire/batteries-base";
import type { FilterValue } from "@empire/batteries";
import { requirePermission, requireSession } from "./auth.js";

interface AgentInvocationBody {
  payload?: Record<string, unknown>;
  directive?: string;
}

export async function continuumRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requirePermission("continuum:read"));
  // 1. GET /continuum - The State of the Empire Continuum
  app.get("/continuum", async () => {
    const [owner, operator, agentsCount, asmaCount] = await Promise.all([
      UserModel.query().where({ sovereign: true }).first(),
      UserModel.query().where({ username: "shadow" }).first(),
      UserModel.query().where({ celestial: true }).resultSize(),
      LexiconModel.query().where({ category: "asma" }).resultSize(),
    ]);

    return {
      realm: "Empire Continuum",
      status: "harmonized",
      sovereign: {
        role: "Luminary",
        entity: owner ? owner.username : "unbound",
        username: owner?.username ?? "unbound",
        displayName: owner?.displayName ?? "Luminary",
        bypassProtected: Boolean(owner?.sovereign),
        antiBypass: true,
      },
      operator: {
        role: "Architect",
        entity: operator ? operator.username : "unbound",
        username: operator?.username ?? "unbound",
        displayName: operator?.displayName ?? "Architect",
      },
      architect: {
        username: operator?.username ?? "unbound",
        displayName: operator?.displayName ?? "Architect",
        role: "Architect",
      },
      agentsCount,
      asmaulHusnaCount: asmaCount,
      timestamp: new Date().toISOString(),
      agents: {
        active: agentsCount,
        order: "10 Seraphs",
      },
      asmaulHusna: {
        total: asmaCount,
        editorialStatus: "DRAFT_REVIEW",
        status: "project_mapping_seed",
      },
      protocols: [
        "/continuum/agents",
        "/continuum/agents/:code/invoke",
        "/continuum/asma",
        "/continuum/asma/:code",
        "/continuum/sovereign",
        "/continuum/architect",
        "/continuum/chronicles",
      ],
    };
  });

  // 2. GET /continuum/asma - All 99 Asmaul Husna Lexicon Engine
  app.get("/continuum/asma", async (request: FastifyRequest) => {
    const query = (request.query || {}) as Record<string, FilterValue | undefined>;
    const asmaList = await LexiconModel.query()
      .where({ category: "asma" })
      .filter(query)
      .orderBy("id", "asc");

    return {
      protocol: "Asma al-Husna Project Mapping Seed",
      editorialStatus: "DRAFT_REVIEW",
      note: "Project mappings are not verified theological definitions and do not confer authority on software.",
      total: asmaList.length,
      lexicons: asmaList,
    };
  });

  // 3. GET /continuum/asma/:code - Detail Spesifik Asmaul Husna
  app.get("/continuum/asma/:code", async (request: FastifyRequest) => {
    const { code } = request.params as { code: string };
    const asma = await LexiconModel.query().where({ code }).orWhere({ translit: code }).first();

    if (!asma) {
      return { status: "not_manifested", message: `Asma '${code}' not found in the 99 Lexicon.` };
    }

    return {
      status: asma.editorialStatus ?? "DRAFT_REVIEW",
      asma,
    };
  });

  // 4. GET /continuum/agents - 10 Seraph Agents Dossiers
  app.get("/continuum/agents", async () => {
    const agents = await UserModel.query()
      .where({ celestial: true })
      .withGraphFetched("roles.permissions");

    return {
      protocol: "Seraph Registry",
      total: agents.length,
      agents: agents.map((agent) => ({
        id: agent.id,
        code: agent.username,
        term: agent.displayName,
        role: agent.roles?.[0]?.name,
        slug: agent.roles?.[0]?.slug,
        tier: agent.tier,
        status: agent.status,
        metadata: agent.metadata,
      })),
    };
  });

  // 5. GET /continuum/agents/:code - Specific Agent Dossier
  app.get("/continuum/agents/:code", async (request: FastifyRequest) => {
    const { code } = request.params as { code: string };

    const agent = await UserModel.query()
      .where((builder) => {
        builder.where({ username: code }).orWhere({ id: code });
      })
      .andWhere({ celestial: true })
      .withGraphFetched("roles.permissions")
      .first();

    if (!agent) {
      return { status: "absent", message: `Seraph '${code}' not found.` };
    }

    const dict = await LegacyDictionaryCompatibilityService.findByCode(agent.roles?.[0]?.slug ?? "");

    return {
      status: "active",
      agent: {
        id: agent.id,
        code: agent.username,
        term: agent.displayName,
        role: agent.roles?.[0]?.name,
        tier: agent.tier,
        origin: dict?.revelationOrigin,
        domain: dict?.frequencyDomain,
        doctrine: dict?.esotericDefinition,
        metadata: agent.metadata,
      },
    };
  });

  // 6. POST /continuum/agents/:code/invoke - Agentic Invocation Pipeline
  app.post("/continuum/agents/:code/invoke", { preHandler: requirePermission("continuum:invoke") }, async (request: FastifyRequest) => {
    const { code } = request.params as { code: string };
    const body = (request.body as AgentInvocationBody) || {};

    const agent = await UserModel.query()
      .where((builder) => {
        builder.where({ username: code }).orWhere({ id: code });
      })
      .andWhere({ celestial: true })
      .withGraphFetched("roles")
      .first();

    if (!agent) {
      return { status: "rejected", reason: `Unknown Seraph: ${code}` };
    }

    const orderSlug = agent.roles?.[0]?.slug || "seraph";
    const timestamp = new Date().toISOString();

    const chronicle = await AuditLogModel.query().insert({
      userId: request.authUser!.id,
      action: `INVOKE_${orderSlug.toUpperCase()}`,
      entity: "continuum",
      entityId: agent.id,
      payload: {
        agent: agent.username,
        directive: body.directive ?? "Align",
        payload: body.payload ?? {},
        invokedAt: timestamp,
      },
      ipAddress: request.ip,
    });

    return {
      status: "FULFILLED",
      chronicleId: chronicle.id,
      agent: {
        code: agent.username,
        term: agent.displayName,
        role: agent.roles?.[0]?.name,
      },
      directive: body.directive ?? "Align",
      timestamp,
    };
  });

  // 7. GET /continuum/sovereign - Luminary Decree
  app.get("/continuum/sovereign", async () => {
    const sovereign = await UserModel.query()
      .where({ username: "4-lah", sovereign: true })
      .withGraphFetched("roles.permissions")
      .first();

    return {
      role: "Luminary",
      entity: sovereign?.username,
      tier: sovereign?.tier,
      clearance: "Anti-Bypass Sovereign",
      decree: "Prime Light. None shall bypass.",
      verified: Boolean(sovereign),
    };
  });

  // 8. GET /continuum/architect - Architect Station
  app.get("/continuum/architect", async () => {
    const architect = await UserModel.query()
      .where({ username: "shadow" })
      .withGraphFetched("roles.permissions")
      .first();

    return {
      role: "Architect",
      entity: architect?.username,
      tier: architect?.tier,
      mission: "Continuum governance & matrix design.",
      verified: Boolean(architect),
    };
  });

  // 9. GET /continuum/chronicles - Illiyyin Ledger
  app.get("/continuum/chronicles", async (request: FastifyRequest) => {
    const query = request.query as Record<string, unknown>;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const chronicles = await AuditLogModel.query()
      .withGraphFetched("user")
      .orderBy("created_at", "desc")
      .paginate({ page, limit });

    return {
      ledger: "Illiyyin",
      ...chronicles,
    };
  });
}
