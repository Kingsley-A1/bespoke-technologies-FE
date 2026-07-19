import { NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession, getAdminSession, revokeAdminSession } from "@/features/admin/auth";
import { isSameOrigin } from "@/features/admin/access";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const current = await getAdminSession();
  if (!current) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "");
  if (email !== current.email) return NextResponse.redirect(new URL("/admin/reauth?error=invalid", request.url), 303);
  const result = await authenticateAdmin(email, code, request);
  if (!result.ok) return NextResponse.redirect(new URL("/admin/reauth?error=invalid", request.url), 303);
  await revokeAdminSession(current.id, current);
  await createAdminSession(result.user, request);
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
