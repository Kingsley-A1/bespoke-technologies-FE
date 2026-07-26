import { NextResponse } from "next/server";
import { getOwnershipCertificateByToken } from "@/features/admin/certificates/repository";
import { getR2ObjectBytes } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const certificate = await getOwnershipCertificateByToken((await params).token);
  if (!certificate?.pdfKey || certificate.status !== "issued") return new NextResponse(null, { status: 404 });
  const object = await getR2ObjectBytes(certificate.pdfKey);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(object.bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

