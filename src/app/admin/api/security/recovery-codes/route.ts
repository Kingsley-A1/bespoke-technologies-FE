import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { issueAdminRecoveryCodes } from "@/features/admin/auth";

const schema = z.object({ currentCode: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("dashboard.view");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the current 6-digit authenticator code." }, { status: 400 });

  const result = await issueAdminRecoveryCodes(access.session, parsed.data.currentCode);
  if (!result.ok) return NextResponse.json({ error: "The current authenticator code could not be verified." }, { status: 401 });
  return NextResponse.json({
    ok: true,
    codes: result.codes,
    warning: "These codes are shown once. Store them offline before leaving this page.",
  });
}
