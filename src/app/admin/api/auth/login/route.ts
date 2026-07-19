import { NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession } from "@/features/admin/auth";
import { isSameOrigin } from "@/features/admin/access";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");
  const result = await authenticateAdmin(email, code, request);
  if (!result.ok) return NextResponse.redirect(new URL(`/admin/login?error=${result.reason}`, request.url), 303);
  await createAdminSession(result.user, request);
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}

