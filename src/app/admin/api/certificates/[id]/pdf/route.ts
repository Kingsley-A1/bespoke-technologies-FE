import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/access";
import { getOwnershipCertificate } from "@/features/admin/certificates/repository";
import { getR2ObjectBytes } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("certificates.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const certificate = await getOwnershipCertificate((await params).id);
  if (!certificate?.pdfKey) return NextResponse.json({ error: "Issued certificate PDF not found." }, { status: 404 });
  const object = await getR2ObjectBytes(certificate.pdfKey);
  if (!object) return NextResponse.json({ error: "Issued certificate PDF not found." }, { status: 404 });
  return new NextResponse(Buffer.from(object.bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`, "Cache-Control": "private, no-store" } });
}

