import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import { revokeOwnershipCertificate } from "@/features/admin/certificates/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertRecentAdminPermission("certificates.revoke");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z.object({ reason: z.string().trim().min(10).max(500) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a revocation reason of at least 10 characters." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, certificate: await revokeOwnershipCertificate((await params).id, parsed.data.reason, access.session) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The certificate could not be revoked." }, { status: 400 });
  }
}

