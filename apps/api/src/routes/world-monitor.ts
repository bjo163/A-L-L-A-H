import type { FastifyInstance } from "fastify";
import { getWorldMonitoringSnapshot } from "@empire/batteries-world-monitor";
import type { WorldMonitoringSnapshot } from "@empire/batteries-world-monitor";
import { checkDatabaseHealth } from "../db.js";

export async function worldMonitorRoutes(app: FastifyInstance) {
  // This endpoint stays public for the pre-login HUD. It returns aggregate health only;
  // audit events and user data are intentionally excluded.
  app.get(
    "/v1/world-monitor",
    {
      schema: {
        tags: ["System"],
        summary: "World monitoring snapshot with explicit unavailable states for unconnected sources",
        security: [],
      },
    },
    async (): Promise<WorldMonitoringSnapshot> => {
      let databaseStatus: WorldMonitoringSnapshot["databaseStatus"] = "unknown";
      try {
        databaseStatus = (await checkDatabaseHealth()).ok ? "available" : "unavailable";
      } catch {
        // Preserve the distinction between an unhealthy database and a failed health check.
      }

      const status: WorldMonitoringSnapshot["status"] = databaseStatus === "available"
        ? "operational"
        : databaseStatus === "unavailable" ? "degraded" : "unavailable";
      const snapshot = getWorldMonitoringSnapshot();

      return {
        ...snapshot,
        status,
        timestamp: new Date().toISOString(),
        globalAlertLevel: databaseStatus === "available"
          ? "green"
          : databaseStatus === "unavailable" ? "yellow" : "unknown",
        apiUptimeSeconds: Number(process.uptime().toFixed(3)),
        databaseStatus,
      };
    },
  );
}
