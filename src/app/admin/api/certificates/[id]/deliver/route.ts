import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { getOwnershipCertificate, recordCertificateDelivery } from "@/features/admin/certificates/repository";
import { EMAIL_ADDRESSES } from "@/lib/email/addresses";
import { sendEmail } from "@/lib/email/client";
import { ownershipCertificateEmail } from "@/lib/email/templates/transactional";
import { getR2ObjectBytes } from "@/lib/storage/r2";
import { documentVerificationUrl } from "@/lib/company";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await assertAdminPermission("certificates.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z.object({ email: z.email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid delivery email." }, { status: 400 });
  const certificate = await getOwnershipCertificate((await params).id);
  if (!certificate?.pdfKey || !certificate.verificationToken || certificate.status !== "issued") {
    return NextResponse.json({ error: "An issued certificate is required." }, { status: 400 });
  }
  const file = await getR2ObjectBytes(certificate.pdfKey);
  if (!file) return NextResponse.json({ error: "The issued PDF could not be read." }, { status: 404 });
  const verificationUrl = documentVerificationUrl(
    certificate.certificateNumber,
    certificate.verificationToken,
  );
  const rendered = ownershipCertificateEmail({
    ownerName: certificate.owner.name,
    projectName: certificate.project.name,
    certificateNumber: certificate.certificateNumber,
    verificationUrl,
  });
  const result = await sendEmail({
    from: { address: EMAIL_ADDRESSES.noReply, name: "Bespoke Technologies" },
    to: parsed.data.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: EMAIL_ADDRESSES.support,
    attachments: [{ filename: `${certificate.certificateNumber}.pdf`, content: Buffer.from(file.bytes) }],
  });
  const updated = await recordCertificateDelivery(certificate.id, {
    to: parsed.data.email,
    ok: result.ok,
    providerId: result.ok ? result.id || undefined : undefined,
    error: result.ok ? undefined : result.error,
  }, access.session);
  return NextResponse.json(result.ok ? { ok: true, certificate: updated } : { error: result.error, certificate: updated }, { status: result.ok ? 200 : 502 });
}
