import { NextRequest, NextResponse } from "next/server";
import { IDEA_GATE_DECISIONS, IDEA_GATE_PATH } from "@/features/idea-gate/definition";
import { saveIdeaGateContact } from "@/features/idea-gate/repository";
import { saveIdeaGateContactSchema } from "@/features/idea-gate/schema";
import {
  assertIdeaGateSameOrigin,
  readIdeaGateCredential,
} from "@/features/idea-gate/security";
import { EMAIL_ADDRESSES } from "@/lib/email/addresses";
import { sendEmail } from "@/lib/email/client";
import { ideaExecutionGateReportEmail } from "@/lib/email/templates/transactional";
import { absoluteUrl } from "@/lib/seo";

/**
 * Contact details are captured only after the person already has their result,
 * so this endpoint never gates access to the report.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertIdeaGateSameOrigin(request);
    const { id } = await context.params;
    const credential = readIdeaGateCredential(request);
    if (!credential || credential.id !== id) {
      return NextResponse.json({ message: "Assessment session not found." }, { status: 401 });
    }
    const parsed = saveIdeaGateContactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Check the contact details." },
        { status: 400 },
      );
    }
    const assessment = await saveIdeaGateContact(id, credential.tokenHash, {
      contactName: parsed.data.contactName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      contactConsent: parsed.data.contactConsent,
      shareIdeaTitle: parsed.data.shareIdeaTitle,
    });
    if (!assessment) {
      return NextResponse.json({ message: "Assessment session not found." }, { status: 404 });
    }

    let emailed = false;
    if (
      parsed.data.sendReport &&
      assessment.email &&
      assessment.shareToken &&
      assessment.result
    ) {
      const rendered = ideaExecutionGateReportEmail({
        ideaTitle: assessment.ideaTitle,
        totalScore: assessment.result.totalScore,
        maxScore: assessment.result.maxScore,
        gatesPassed: assessment.result.gatesPassed,
        decisionLabel: IDEA_GATE_DECISIONS[assessment.result.decision].label,
        reportUrl: absoluteUrl(`${IDEA_GATE_PATH}/report/${assessment.shareToken}`),
      });
      const delivery = await sendEmail({
        from: { address: EMAIL_ADDRESSES.noReply },
        to: assessment.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: EMAIL_ADDRESSES.support,
      });
      emailed = delivery.ok;
      if (!delivery.ok && !delivery.skipped) {
        console.error("[idea-gates] report email failed:", delivery.error);
      }
    }

    return NextResponse.json({ assessment, emailed });
  } catch (error) {
    console.error("[idea-gates] contact save failed:", error);
    return NextResponse.json(
      { message: "Your details could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
