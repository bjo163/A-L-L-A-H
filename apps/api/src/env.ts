import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const toPort = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  HOST: process.env.API_HOST ?? process.env.HOST ?? "127.0.0.1",
  PORT: toPort(process.env.API_PORT ?? process.env.PORT, 4000),
  CORS_ORIGIN:
    process.env.CORS_ORIGINS ??
    process.env.CORS_ORIGIN ??
    "http://localhost:3000,http://localhost:3300,http://localhost:5173,http://127.0.0.1:5173",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
} as const;

export type Env = typeof env;
