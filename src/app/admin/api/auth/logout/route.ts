import { NextResponse } from "next/server";
import { clearAdminSession } from "@/features/admin/auth";
import { isSameOrigin } from "@/features/admin/access";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  await clearAdminSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}

