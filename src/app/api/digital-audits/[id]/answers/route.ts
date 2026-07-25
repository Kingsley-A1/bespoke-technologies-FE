import { NextRequest, NextResponse } from "next/server";
import { saveDigitalAuditAnswer } from "@/features/digital-audits/repository";
import { saveDigitalAuditAnswerSchema } from "@/features/digital-audits/schema";
import {
  assertDigitalAuditSameOrigin,
  readDigitalAuditCredential,
} from "@/features/digital-audits/security";

export async function PUT(
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
    const parsed = saveDigitalAuditAnswerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid answer." },
        { status: 400 },
      );
    }
    const audit = await saveDigitalAuditAnswer(
      id,
      credential.tokenHash,
      parsed.data.questionId,
      parsed.data.optionIndex,
    );
    if (!audit) {
      return NextResponse.json({ message: "Audit session not found." }, { status: 404 });
    }
    return NextResponse.json({ audit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Answer could not be saved.";
    const status = message.includes("read-only") ? 409 : 500;
    console.error("[digital-audits] answer save failed:", error);
    return NextResponse.json({ message }, { status });
  }
}
