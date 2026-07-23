import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { deleteInvoiceDraft } from "@/features/admin/billing/drafts";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("billing.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  await deleteInvoiceDraft((await params).id, access.session);
  return NextResponse.json({ ok: true });
}
