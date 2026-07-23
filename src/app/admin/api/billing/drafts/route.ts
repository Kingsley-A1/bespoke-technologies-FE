import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { listInvoiceDrafts, saveInvoiceDraft } from "@/features/admin/billing/drafts";

const draftSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(180).optional(),
  payload: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const access = await assertAdminPermission("billing.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  return NextResponse.json({ drafts: await listInvoiceDrafts(access.session) });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("billing.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = draftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The invoice draft is invalid." }, { status: 400 });
  const draft = await saveInvoiceDraft(parsed.data, access.session);
  return NextResponse.json({ draft }, { status: parsed.data.id ? 200 : 201 });
}
