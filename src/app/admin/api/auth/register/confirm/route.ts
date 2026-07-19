import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmTotpEnrollment } from "@/features/admin/auth";
import { isSameOrigin } from "@/features/admin/access";

export const runtime = "nodejs";

const confirmSchema = z.object({
  email: z.email().max(240),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator."),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your authenticator." }, { status: 400 });
  }

  const result = await confirmTotpEnrollment(parsed.data.email, parsed.data.code, request);
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.reason === "locked"
            ? "Too many attempts. Wait 15 minutes and try again."
            : "The code could not be verified. Scan the QR again if the setup expired.",
      },
      { status: result.reason === "locked" ? 429 : 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
