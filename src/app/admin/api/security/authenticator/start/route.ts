import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { beginAuthenticatorRotation } from "@/features/admin/auth";

export const runtime = "nodejs";

const schema = z.object({
  currentCode: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("dashboard.view");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the current 6-digit authenticator code." }, { status: 400 });

  const result = await beginAuthenticatorRotation(access.session, parsed.data.currentCode, request);
  if (!result.ok) return NextResponse.json({ error: "The current authenticator code could not be verified." }, { status: 401 });
  const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, {
    width: 240,
    margin: 1,
    color: { dark: "#0b1f3a", light: "#ffffff" },
  });
  return NextResponse.json({ ok: true, secret: result.secret, qrDataUrl });
}
