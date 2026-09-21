import { NextRequest, NextResponse } from "next/server";
import { adminQuery } from "@/features/admin/db";
import { createIdeaGate } from "@/features/idea-gate/repository";
import { createIdeaGateSchema } from "@/features/idea-gate/schema";
import {
  assertIdeaGateSameOrigin,
  createIdeaGateToken,
  hashIdeaGateToken,
  ideaGateNetworkHash,
  setIdeaGateCredential,
} from "@/features/idea-gate/security";

const MAX_CREATIONS_PER_HOUR = 10;

async function isRateLimited(request: Request) {
  const networkHash = ideaGateNetworkHash(request);
  const result = await adminQuery<{ count: string }>(
    `SELECT count(*)::STRING AS count FROM idea_execution_gate_submission_attempts
     WHERE network_hash=$1 AND attempted_at >= now() - INTERVAL '1 hour'`,
    [networkHash],
  );
  if (Number(result.rows[0]?.count ?? 0) >= MAX_CREATIONS_PER_HOUR) return true;
  await adminQuery(
    "INSERT INTO idea_execution_gate_submission_attempts (network_hash) VALUES ($1)",
    [networkHash],
  );
  return false;
}

export async function POST(request: NextRequest) {
  try {
    assertIdeaGateSameOrigin(request);
    if (await isRateLimited(request)) {
      return NextResponse.json(
        { message: "Too many assessments started. Please try again later." },
        { status: 429 },
      );
    }
    const parsed = createIdeaGateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Check the idea details." },
        { status: 400 },
      );
    }
    if (parsed.data.website) return new NextResponse(null, { status: 204 });
    const resumeToken = createIdeaGateToken();
    const assessment = await createIdeaGate({
      ideaTitle: parsed.data.ideaTitle,
      ideaSummary: parsed.data.ideaSummary,
      ideaStage: parsed.data.ideaStage,
      ownerRole: parsed.data.ownerRole,
      source: parsed.data.source,
      attribution: parsed.data.attribution,
      resumeTokenHash: hashIdeaGateToken(resumeToken),
    });
    const response = NextResponse.json({ assessment }, { status: 201 });
    setIdeaGateCredential(response, assessment.id, resumeToken);
    return response;
  } catch (error) {
    console.error("[idea-gates] create failed:", error);
    return NextResponse.json(
      { message: "The assessment could not be started. Please try again." },
      { status: 500 },
    );
  }
}
