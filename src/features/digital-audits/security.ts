import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const DIGITAL_AUDIT_COOKIE = "bt_digital_audit";
const RESUME_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function auditPepper() {
  const value = process.env.DIGITAL_AUDIT_HASH_PEPPER?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("DIGITAL_AUDIT_HASH_PEPPER is required in production.");
  }
  return "local-digital-audit-pepper-change-before-production";
}

export function createDigitalAuditToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashDigitalAuditToken(token: string) {
  return createHmac("sha256", auditPepper()).update(token).digest("hex");
}

export function safeTokenHashEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function digitalAuditNetworkHash(request: Request) {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return createHmac("sha256", auditPepper()).update(address).digest("hex");
}

export function assertDigitalAuditSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (origin !== request.nextUrl.origin) {
    throw new Error("Cross-origin audit mutation rejected.");
  }
}

export function readDigitalAuditCredential(request: NextRequest) {
  const value = request.cookies.get(DIGITAL_AUDIT_COOKIE)?.value ?? "";
  const separator = value.indexOf(".");
  if (separator < 1) return null;
  const id = value.slice(0, separator);
  const token = value.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id) || token.length < 32) return null;
  return { id, token, tokenHash: hashDigitalAuditToken(token) };
}

export function setDigitalAuditCredential(
  response: NextResponse,
  id: string,
  token: string,
) {
  response.cookies.set(DIGITAL_AUDIT_COOKIE, `${id}.${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: RESUME_MAX_AGE_SECONDS,
  });
}

export function clearDigitalAuditCredential(response: NextResponse) {
  response.cookies.set(DIGITAL_AUDIT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
