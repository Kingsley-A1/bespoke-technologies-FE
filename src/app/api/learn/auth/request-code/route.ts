import { NextResponse } from "next/server";
import { isSameOrigin } from "@/features/admin/access";
import { requestLearnerSignInCode } from "@/features/learn/learner-auth.server";

const accepted = { ok: true, message: "If that address can receive a sign-in code, it has been sent." };

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
  try {
    const body = await request.json() as { email?: unknown };
    await requestLearnerSignInCode({ email: String(body.email ?? ""), request });
  } catch {
    // This endpoint deliberately has one accepted response for malformed,
    // rate-limited, unavailable, and unknown-account attempts.
  }
  return NextResponse.json(accepted, { status: 202 });
}
