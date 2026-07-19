import { NextResponse } from "next/server";
import { isSameOrigin } from "@/features/admin/access";
import { applyAdminSecurityRetention, getAdminSession, syncConfiguredAdminUsers } from "@/features/admin/auth";
import { reconcileOverdueDocuments, runRecurringSchedules } from "@/features/admin/repository";
import type { AdminSession } from "@/features/admin/types";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const cronAuthorized = Boolean(process.env.ADMIN_CRON_SECRET && authorization === `Bearer ${process.env.ADMIN_CRON_SECRET}`);
  const interactiveSession = await getAdminSession();
  if (!cronAuthorized && !interactiveSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!cronAuthorized && !isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const session: AdminSession = interactiveSession ?? {
    id: "00000000-0000-4000-8000-000000000099",
    userId: "00000000-0000-4000-8000-000000000001",
    email: "scheduler@bespoketech.com.ng",
    displayName: "Bespoke Scheduler",
    role: "founder_admin",
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  // The scheduler identity references the configured Founder record. Sync the
  // two allowed users before the first production cron run to satisfy FKs.
  if (cronAuthorized) await syncConfiguredAdminUsers();
  await applyAdminSecurityRetention();
  const overdue = await reconcileOverdueDocuments(session);
  const result = await runRecurringSchedules(session);
  return NextResponse.json({ overdue, due: result.due, generated: result.generated.length });
}
