import { NextRequest, NextResponse } from "next/server";
import { getIdeaGateForResume } from "@/features/idea-gate/repository";
import {
  clearIdeaGateCredential,
  readIdeaGateCredential,
} from "@/features/idea-gate/security";

export async function GET(request: NextRequest) {
  try {
    const credential = readIdeaGateCredential(request);
    if (!credential) return new NextResponse(null, { status: 204 });
    const assessment = await getIdeaGateForResume(credential.id, credential.tokenHash);
    if (!assessment) {
      const response = new NextResponse(null, { status: 204 });
      clearIdeaGateCredential(response);
      return response;
    }
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("[idea-gates] resume failed:", error);
    return NextResponse.json(
      { message: "Saved progress could not be loaded." },
      { status: 500 },
    );
  }
}
