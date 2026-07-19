import "server-only";

import { redirect } from "next/navigation";
import { getAdminSession } from "./auth";
import { hasPermission } from "./permissions";
import type { AdminPermission } from "./types";

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const session = await requireAdminSession();
  if (!hasPermission(session.role, permission)) redirect("/admin/unauthorized");
  return session;
}

export async function requireRecentAdminPermission(permission: AdminPermission, maxAgeMs = 15 * 60 * 1000) {
  const session = await requireAdminPermission(permission);
  if (Date.now() - new Date(session.createdAt).getTime() > maxAgeMs) redirect("/admin/reauth");
  return session;
}

export async function assertAdminPermission(permission: AdminPermission) {
  const session = await getAdminSession();
  if (!session) return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  if (!hasPermission(session.role, permission)) return { ok: false as const, status: 403 as const, error: "Forbidden" };
  return { ok: true as const, session };
}

export async function assertRecentAdminPermission(permission: AdminPermission, maxAgeMs = 15 * 60 * 1000) {
  const result = await assertAdminPermission(permission);
  if (!result.ok) return result;
  if (Date.now() - new Date(result.session.createdAt).getTime() > maxAgeMs) {
    return { ok: false as const, status: 401 as const, error: "Reauthentication required" };
  }
  return result;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    const expectedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
      || request.headers.get("host")
      || new URL(request.url).host;
    return new URL(origin).host === expectedHost;
  } catch {
    return false;
  }
}
