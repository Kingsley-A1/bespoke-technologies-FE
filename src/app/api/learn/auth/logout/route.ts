import { NextResponse } from "next/server";
import { isSameOrigin } from "@/features/admin/access";
import { clearLearnerSession } from "@/features/learn/learner-auth.server";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
  await clearLearnerSession();
  return NextResponse.redirect(new URL("/sign-in", request.url), 303);
}
