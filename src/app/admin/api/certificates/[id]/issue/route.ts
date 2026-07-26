import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import { loadCertificatePdfAssets } from "@/features/admin/certificates/assets";
import { generateOwnershipCertificatePdf } from "@/features/admin/certificates/pdf";
import { getOwnershipCertificate, issueOwnershipCertificate } from "@/features/admin/certificates/repository";
import { createCertificateToken } from "@/features/admin/certificates/security";
import { deleteR2Object, isR2Configured, putR2Object } from "@/lib/storage/r2";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertRecentAdminPermission("certificates.issue");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isR2Configured()) return NextResponse.json({ error: "Certificate storage is not configured." }, { status: 503 });
  const id = (await params).id;
  const certificate = await getOwnershipCertificate(id);
  if (!certificate || certificate.status !== "draft") return NextResponse.json({ error: "An active certificate draft is required." }, { status: 404 });
  const { token, tokenHash } = createCertificateToken();
  const verificationUrl = `https://www.bespoketech.com.ng/ownership/verify/${token}`;
  const issuedAt = new Date().toISOString();
  const pdfCertificate = { ...certificate, issuedAt };
  const key = `ownership-certificates/${certificate.certificateNumber}-${randomUUID()}.pdf`;
  try {
    const assets = await loadCertificatePdfAssets(pdfCertificate, verificationUrl);
    const bytes = await generateOwnershipCertificatePdf(pdfCertificate, assets);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await putR2Object({ key, body: bytes, contentType: "application/pdf" });
    const issued = await issueOwnershipCertificate(id, { token, tokenHash, pdfKey: key, pdfSha256: sha256, issuedAt }, access.session);
    return NextResponse.json({ ok: true, certificate: issued, verificationUrl });
  } catch (error) {
    await deleteR2Object(key).catch(() => undefined);
    console.error("Ownership certificate issuance failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The certificate could not be issued." }, { status: 400 });
  }
}

