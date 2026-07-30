import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { listAdminSessions, revokeAdminSession } from "@/features/admin/auth";

const schema = z.object({ sessionId: z.uuid() });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("dashboard.view");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select a valid session." }, { status: 400 });

  const owned = (await listAdminSessions(access.session.userId)).some((item) => item.id === parsed.data.sessionId);
  if (!owned) return NextResponse.json({ error: "That session does not belong to this identity." }, { status: 404 });
  await revokeAdminSession(parsed.data.sessionId, access.session, "Self-service security revocation");
  return NextResponse.json({ ok: true, currentSession: parsed.data.sessionId === access.session.id });
}
