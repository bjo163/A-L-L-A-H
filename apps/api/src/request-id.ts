import { randomUUID } from "node:crypto";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

/** Reuse only bounded, header-safe caller IDs; otherwise generate an opaque ID. */
export function createRequestId(value: string | string[] | undefined): string {
  if (typeof value === "string" && SAFE_REQUEST_ID.test(value)) return value;
  return randomUUID();
}
