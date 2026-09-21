import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const IDEA_GATE_COOKIE = "bt_idea_gate";
const RESUME_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function ideaGatePepper() {
  const value = process.env.IDEA_GATE_HASH_PEPPER?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("IDEA_GATE_HASH_PEPPER is required in production.");
  }
  return "local-idea-gate-pepper-change-before-production";
}

export function createIdeaGateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashIdeaGateToken(token: string) {
  return createHmac("sha256", ideaGatePepper()).update(token).digest("hex");
}

export function ideaGateNetworkHash(request: Request) {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return createHmac("sha256", ideaGatePepper()).update(address).digest("hex");
}

export function assertIdeaGateSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (origin !== request.nextUrl.origin) {
    throw new Error("Cross-origin idea gate mutation rejected.");
  }
}

/** Parses the resume cookie value. Presence is never authorization on its own. */
export function parseIdeaGateCookie(raw: string | undefined) {
  const value = raw ?? "";
  const separator = value.indexOf(".");
  if (separator < 1) return null;
  const id = value.slice(0, separator);
  const token = value.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id) || token.length < 32) return null;
  return { id, token, tokenHash: hashIdeaGateToken(token) };
}

export function readIdeaGateCredential(request: NextRequest) {
  return parseIdeaGateCookie(request.cookies.get(IDEA_GATE_COOKIE)?.value);
}

export function setIdeaGateCredential(response: NextResponse, id: string, token: string) {
  response.cookies.set(IDEA_GATE_COOKIE, `${id}.${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: RESUME_MAX_AGE_SECONDS,
  });
}

export function clearIdeaGateCredential(response: NextResponse) {
  response.cookies.set(IDEA_GATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
