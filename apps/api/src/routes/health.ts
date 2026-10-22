import type { FastifyInstance } from "fastify";
import { checkDatabaseHealth } from "../db.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const dbHealth = await checkDatabaseHealth();
    return {
      status: dbHealth.ok ? "ok" : "degraded",
      service: "empire-api",
      database: dbHealth,
      uptime: Number(process.uptime().toFixed(3)),
      timestamp: new Date().toISOString(),
    };
  });
}
