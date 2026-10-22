import type { FastifyInstance, FastifyRequest } from "fastify";
import { UserModel, DictionaryModel } from "@empire/batteries-base";
import type { FilterValue } from "@empire/batteries";
import { requirePermission, requireSession } from "./auth.js";

export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireSession);
  app.addHook("preHandler", requirePermission("users:manage"));
  // GET /users - smart pagination and dynamic filter
  app.get("/users", async (request: FastifyRequest) => {
    const query = (request.query || {}) as Record<string, FilterValue | undefined>;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const filters = Object.fromEntries(
      Object.entries(query).filter(([key]) => key !== "page" && key !== "limit"),
    ) as Record<string, FilterValue | undefined>;

    const result = await UserModel.query()
      .withGraphFetched("roles")
      .filter(filters)
      .paginate({ page, limit });

    return result;
  });

  // GET /sovereign - verify Owner account (4-lah)
  app.get("/sovereign", async () => {
    const sovereign = await UserModel.query()
      .where({ username: "4-lah", sovereign: true })
      .withGraphFetched("roles.permissions")
      .first();

    return {
      status: sovereign ? "verified" : "not_found",
      title: "The Prime Luminary (Sovereign of the First Light)",
      owner: sovereign,
    };
  });

  // GET /operator - verify Operator account (shadow)
  app.get("/operator", async () => {
    const operator = await UserModel.query()
      .where({ username: "shadow" })
      .withGraphFetched("roles.permissions")
      .first();

    return {
      status: operator ? "verified" : "not_found",
      title: "The Grand Architect (Vanguard of Continuum)",
      operator,
    };
  });

  // GET /bots - list 10 celestial seraph agents with universal orders
  app.get("/bots", async () => {
    const bots = await UserModel.query()
      .where({ celestial: true })
      .withGraphFetched("roles.permissions");

    return {
      system: "Empire of the Light",
      total: bots.length,
      orders: "10 Celestial Seraph Agents (4 Revelations)",
      bots,
    };
  });

  // GET /dictionary - Sacred & Funky Universal Dictionary
  app.get("/dictionary", async (request: FastifyRequest) => {
    const query = (request.query || {}) as Record<string, FilterValue | undefined>;
    const entries = await DictionaryModel.query().filter(query);

    return {
      system: "Empire of the Light Universal Dictionary",
      total: entries.length,
      entries,
    };
  });
}
