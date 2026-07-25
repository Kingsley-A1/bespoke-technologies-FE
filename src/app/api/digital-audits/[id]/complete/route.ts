import { NextRequest, NextResponse } from "next/server";
import {
  completeDigitalAudit,
  getDigitalAuditForResume,
} from "@/features/digital-audits/repository";
import {
  assertDigitalAuditSameOrigin,
  createDigitalAuditToken,
  readDigitalAuditCredential,
} from "@/features/digital-audits/security";
import { sendEmail } from "@/lib/email/client";
import { EMAIL_ADDRESSES } from "@/lib/email/addresses";
import { digitalAuditReportEmail } from "@/lib/email/templates/transactional";
import { absoluteUrl } from "@/lib/seo";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertDigitalAuditSameOrigin(request);
    const { id } = await context.params;
    const credential = readDigitalAuditCredential(request);
    if (!credential || credential.id !== id) {
      return NextResponse.json({ message: "Audit session not found." }, { status: 401 });
    }
    const before = await getDigitalAuditForResume(id, credential.tokenHash);
    if (!before) {
      return NextResponse.json({ message: "Audit session not found." }, { status: 404 });
    }
    const audit = await completeDigitalAudit(
      id,
      credential.tokenHash,
      createDigitalAuditToken(24),
    );
    if (!audit.shareToken || !audit.result) {
      throw new Error("The completed report could not be created.");
    }
    const reportPath = `/digital-readiness-audit/report/${audit.shareToken}`;
    if (before.status !== "completed" && audit.email) {
      const rendered = digitalAuditReportEmail({
        businessName: audit.businessName,
        score: audit.result.overall,
        tier: audit.result.tier,
        reportUrl: absoluteUrl(reportPath),
      });
      const delivery = await sendEmail({
        from: { address: EMAIL_ADDRESSES.noReply },
        to: audit.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: EMAIL_ADDRESSES.support,
      });
      if (!delivery.ok && !delivery.skipped) {
        console.error("[digital-audits] report email failed:", delivery.error);
      }
    }
    return NextResponse.json({ audit, reportPath });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The audit could not be completed.";
    const status = message.includes("six audit questions") ? 409 : 500;
    console.error("[digital-audits] completion failed:", error);
    return NextResponse.json({ message }, { status });
  }
}
