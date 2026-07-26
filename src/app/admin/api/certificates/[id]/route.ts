import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { discardOwnershipCertificateDraft } from "@/features/admin/certificates/repository";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("certificates.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const certificate = await discardOwnershipCertificateDraft((await params).id, access.session);
    return NextResponse.json({ ok: true, certificate });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The draft could not be discarded." }, { status: 400 });
  }
}

