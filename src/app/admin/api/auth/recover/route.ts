import { NextResponse } from "next/server";
import { z } from "zod";
import { beginLostDeviceRecovery } from "@/features/admin/auth";
import { isSameOrigin } from "@/features/admin/access";

const schema = z.object({
  email: z.email().max(240),
  recoveryCode: z.string().min(6).max(40),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your admin email and a recovery code." }, { status: 400 });
  const result = await beginLostDeviceRecovery(parsed.data.email, parsed.data.recoveryCode, request);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.reason === "locked"
          ? "Recovery is temporarily locked after repeated attempts. Wait 15 minutes and try again."
          : "The identity or recovery code could not be verified.",
      },
      { status: result.reason === "locked" ? 429 : 401 },
    );
  }
  return NextResponse.json({ ok: true, next: "/admin/recover/setup" });
}
