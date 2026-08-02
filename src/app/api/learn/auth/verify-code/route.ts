import { NextResponse } from "next/server";
import { isSameOrigin } from "@/features/admin/access";
import { verifyLearnerSignInCode } from "@/features/learn/learner-auth.server";

const invalidCode = { ok: false, error: "The code is invalid, expired, or has already been used." };

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
  try {
    const body = await request.json() as { email?: unknown; code?: unknown };
    const result = await verifyLearnerSignInCode({ email: String(body.email ?? ""), code: String(body.code ?? ""), request });
    if (!result.ok) {
      const status = result.reason === "rate_limited" ? 429 : 400;
      return NextResponse.json(result.reason === "rate_limited" ? { ok: false, error: "Please wait before trying another code." } : invalidCode, { status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
