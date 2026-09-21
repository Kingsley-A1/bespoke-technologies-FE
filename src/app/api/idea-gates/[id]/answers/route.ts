import { NextRequest, NextResponse } from "next/server";
import { saveIdeaGateAnswer } from "@/features/idea-gate/repository";
import { saveIdeaGateAnswerSchema } from "@/features/idea-gate/schema";
import {
  assertIdeaGateSameOrigin,
  readIdeaGateCredential,
} from "@/features/idea-gate/security";

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
    const parsed = saveIdeaGateAnswerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid answer." },
        { status: 400 },
      );
    }
    const assessment = await saveIdeaGateAnswer(
      id,
      credential.tokenHash,
      parsed.data.gateId,
      parsed.data.optionIndex,
      parsed.data.evidence,
    );
    if (!assessment) {
      return NextResponse.json({ message: "Assessment session not found." }, { status: 404 });
    }
    return NextResponse.json({ assessment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Answer could not be saved.";
    const status = message.includes("read-only") ? 409 : 500;
    console.error("[idea-gates] answer save failed:", error);
    return NextResponse.json({ message }, { status });
  }
}
