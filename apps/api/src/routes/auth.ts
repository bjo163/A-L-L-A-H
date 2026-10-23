import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHash, randomBytes } from "node:crypto";
import {
  AuditLogModel,
  AuthSessionModel,
  TenantMembershipModel,
  TenantModel,
  UserModel,
  AuthService,
} from "@empire/batteries-base";
import { env } from "../env.js";

export const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");
const rememberCookieName = "empire_remember";
const rememberSessionSeconds = 30 * 24 * 60 * 60;

function readCookie(request: FastifyRequest, name: string): string | null {
  const prefix = `${name}=`;
  const value = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length);
  if (!value) return null;
  try { return decodeURIComponent(value); } catch { return null; }
}

function setRememberCookie(reply: FastifyReply, token: string, remember: boolean) {
  const cookie = [
    `${rememberCookieName}=${remember ? encodeURIComponent(token) : ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${remember ? rememberSessionSeconds : 0}`,
  ];
  if (env.NODE_ENV === "production") cookie.push("Secure");
  reply.header("set-cookie", cookie.join("; "));
}

async function activeTenants(userId: string) {
  const memberships = await TenantMembershipModel.query().where({ user_id: userId, status: "active" }).select("tenant_id", "role");
  if (!memberships.length) return [];
  const tenants = await TenantModel.query().whereIn("id", memberships.map((membership) => membership.tenantId)).select("id", "slug", "display_name");
  const byId = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  return memberships.flatMap((membership) => {
    const tenant = byId.get(membership.tenantId);
    return tenant ? [{ id: tenant.id, slug: tenant.slug, displayName: tenant.displayName, membershipRole: membership.role }] : [];
  });
}

declare module "fastify" {
  interface FastifyRequest {
    authUser: UserModel | null;
    authSession: AuthSessionModel | null;
    tenantId: string | null;
  }
}

export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const cookieToken = readCookie(request, rememberCookieName);
  if (!bearerToken && !cookieToken)
    return reply.code(401).send({ status: "unauthorized", message: "Sesi diperlukan." });

  const findSession = (token: string) => AuthSessionModel.query()
    .where({ token_hash: hashSessionToken(token) })
    .whereNull("revoked_at")
    .where("expires_at", ">", new Date().toISOString())
    .first();
  let session = bearerToken ? await findSession(bearerToken) : null;
  let cookieAuthenticated = false;
  if (!session && cookieToken) {
    session = await findSession(cookieToken);
    cookieAuthenticated = Boolean(session);
  }
  if (!session) {
    if (cookieToken) setRememberCookie(reply, "", false);
    return reply.code(401).send({ status: "unauthorized", message: "Sesi tidak berlaku atau telah berakhir." });
  }

  if (cookieAuthenticated && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
    if (!request.headers.origin || !allowedOrigins.includes(request.headers.origin))
      return reply.code(403).send({ status: "forbidden", message: "Asal permintaan sesi tidak diizinkan." });
  }

  const user = await UserModel.query()
    .findById(session.userId)
    .withGraphFetched("roles.permissions");
  if (!user || user.status !== "active") {
    if (cookieAuthenticated) setRememberCookie(reply, "", false);
    return reply.code(401).send({ status: "unauthorized", message: "Entitas tidak aktif." });
  }
  request.authUser = user;
  request.authSession = session;
}

export function requirePermission(permissionSlug: string) {
  return async function permissionGuard(request: FastifyRequest, reply: FastifyReply) {
    if (!request.authUser || !AuthService.hasPermission(request.authUser, permissionSlug)) {
      return reply.code(403).send({
        status: "forbidden",
        message: `Izin ${permissionSlug} diperlukan.`,
      });
    }
  };
}

interface LoginBody {
  username?: string;
  password?: string;
  rememberMe?: boolean;
}

export async function authRoutes(app: FastifyInstance) {
  // Sessions are opaque and revocable; operators can opt into a 30-day remembered session.
  app.post("/auth/login", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    schema: {
      tags: ["Auth"],
      summary: "Create a local operator session",
      security: [],
      body: {
        type: "object",
        additionalProperties: false,
        required: ["username", "password"],
        properties: {
          username: { type: "string", minLength: 1, maxLength: 120 },
          password: { type: "string", minLength: 1, maxLength: 200 },
          rememberMe: { type: "boolean" },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password, rememberMe = false } = (request.body || {}) as LoginBody;

    if (!username || !password) {
      return reply.status(400).send({
        status: "error",
        message: "Username dan password wajib disertakan.",
      });
    }

    const user = await UserModel.query()
      .where({ username })
      .withGraphFetched("roles.permissions")
      .first();

    if (!user) {
      return reply.status(401).send({
        status: "unauthorized",
        message: "Username atau password tidak valid.",
      });
    }

    if (user.status !== "active") {
      return reply.status(401).send({ status: "unauthorized", message: "Username atau password tidak valid." });
    }

    const isValid = await AuthService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({
        status: "unauthorized",
        message: "Username atau password tidak valid.",
      });
    }

    const isSovereign = AuthService.isSovereignAntiBypass(user);
    const token = randomBytes(32).toString("base64url");
    const session = await AuthSessionModel.query().insert({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + (rememberMe ? rememberSessionSeconds : 8 * 60 * 60) * 1000).toISOString(),
      ipAddress: request.ip,
    });
    await AuditLogModel.query().insert({
      userId: user.id,
      action: "LOGIN",
      entity: "auth_session",
      entityId: session.id,
      payload: { expiresAt: session.expiresAt },
      ipAddress: request.ip,
    });
    setRememberCookie(reply, token, rememberMe);

    return {
      status: "authenticated",
      ...(rememberMe ? {} : { token }),
      tenants: await activeTenants(user.id),
      entity: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        tier: user.tier,
        sovereign: user.sovereign,
        celestial: user.celestial,
        isSovereignAntiBypass: isSovereign,
        role: user.roles?.[0]?.name ?? "Member",
        slug: user.roles?.[0]?.slug ?? "member",
        permissions: user.roles?.flatMap((r) => r.permissions?.map((p) => p.slug) ?? []) ?? [],
      },
    };
  });

  app.post("/auth/logout", { preHandler: requireSession }, async (request, reply) => {
    const session = request.authSession!;
    const user = request.authUser!;
    await session.$query().patch({ revokedAt: new Date().toISOString() });
    setRememberCookie(reply, "", false);
    await AuditLogModel.query().insert({
      userId: user.id,
      action: "LOGOUT",
      entity: "auth_session",
      entityId: session.id,
      ipAddress: request.ip,
    });
    return { status: "logged_out" };
  });

  app.get("/auth/session", { preHandler: requireSession }, async (request) => {
    const user = request.authUser!;
    const role = user.roles?.[0];
    return {
      status: "authenticated",
      tenants: await activeTenants(user.id),
      entity: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        tier: user.tier,
        sovereign: user.sovereign,
        celestial: user.celestial,
        isSovereignAntiBypass: AuthService.isSovereignAntiBypass(user),
        role: role?.name ?? "Member",
        slug: role?.slug ?? "member",
        permissions:
          user.roles?.flatMap(
            (item) => item.permissions?.map((permission) => permission.slug) ?? [],
          ) ?? [],
      },
      expiresAt: request.authSession!.expiresAt,
    };
  });
}
