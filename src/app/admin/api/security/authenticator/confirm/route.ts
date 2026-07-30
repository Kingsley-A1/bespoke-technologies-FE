import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { confirmAuthenticatorRotation } from "@/features/admin/auth";

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("dashboard.view");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code from the new app." }, { status: 400 });

  const result = await confirmAuthenticatorRotation(access.session, parsed.data.code);
  if (!result.ok) return NextResponse.json({ error: "The new app code could not be verified. The old authenticator is still active." }, { status: 401 });
  return NextResponse.json({ ok: true, revokedSessions: result.revokedSessions });
}
