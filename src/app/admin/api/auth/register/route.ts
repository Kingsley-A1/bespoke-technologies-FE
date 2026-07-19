import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { beginTotpEnrollment } from "@/features/admin/auth";
import { isSameOrigin } from "@/features/admin/access";

export const runtime = "nodejs";

const beginSchema = z.object({
  email: z.email().max(240),
  registrationCode: z.string().min(1).max(240),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }
  const parsed = beginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your admin email and registration code." }, { status: 400 });
  }

  const result = await beginTotpEnrollment(parsed.data.email, parsed.data.registrationCode, request);
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === "locked"
            ? "Too many attempts. Wait 15 minutes and try again."
            : "The email or registration code could not be verified.",
      },
      { status: result.reason === "locked" ? 429 : 401 },
    );
  }

  const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, {
    width: 240,
    margin: 1,
    color: { dark: "#0b1f3a", light: "#ffffff" },
  });

  return NextResponse.json({
    ok: true,
    secret: result.secret,
    qrDataUrl,
  });
}
