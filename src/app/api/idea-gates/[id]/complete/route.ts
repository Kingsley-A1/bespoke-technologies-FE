import { NextRequest, NextResponse } from "next/server";
import { IDEA_GATE_PATH } from "@/features/idea-gate/definition";
import { completeIdeaGate } from "@/features/idea-gate/repository";
import {
  assertIdeaGateSameOrigin,
  createIdeaGateToken,
  readIdeaGateCredential,
} from "@/features/idea-gate/security";

// Completion scores deterministically, then generates the written analysis.
export const maxDuration = 30;

export async function POST(
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
    const assessment = await completeIdeaGate(
      id,
      credential.tokenHash,
      createIdeaGateToken(24),
    );
    if (!assessment.shareToken || !assessment.result) {
      throw new Error("The completed report could not be created.");
    }
    return NextResponse.json({
      assessment,
      reportPath: `${IDEA_GATE_PATH}/report/${assessment.shareToken}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The assessment could not be completed.";
    const status = message.includes("ten execution gates")
      ? 409
      : message.includes("not found")
        ? 404
        : 500;
    console.error("[idea-gates] completion failed:", error);
    return NextResponse.json({ message }, { status });
  }
}
