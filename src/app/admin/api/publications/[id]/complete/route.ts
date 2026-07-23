import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import { attachPublicationDocument } from "@/features/admin/publications/repository";
import { isR2Configured, putR2Object } from "@/lib/storage/r2";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertRecentAdminPermission("publications.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isR2Configured()) return NextResponse.json({ error: "Document storage is not configured." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("document");
  if (!(file instanceof File) || file.type !== "application/pdf") return NextResponse.json({ error: "Choose a PDF document." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "The PDF exceeds 25 MB." }, { status: 400 });
  const id = (await params).id;
  const key = `publications/docs/${randomUUID()}.pdf`;
  await putR2Object({ key, body: Buffer.from(await file.arrayBuffer()), contentType: file.type });
  await attachPublicationDocument(id, key, file.type, access.session);
  return NextResponse.json({ ok: true });
}
