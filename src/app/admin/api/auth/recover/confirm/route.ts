import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmLostDeviceRecovery } from "@/features/admin/auth";
import { isSameOrigin } from "@/features/admin/access";

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code from the new authenticator." }, { status: 400 });
  const result = await confirmLostDeviceRecovery(parsed.data.code, request);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === "expired" ? "This recovery session has expired. Start again with another recovery code." : "The new authenticator code could not be verified." },
      { status: result.reason === "expired" ? 410 : 401 },
    );
  }
  return NextResponse.json({ ok: true, next: "/admin/security?recovered=1" });
}
