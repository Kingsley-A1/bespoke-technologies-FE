import { NextRequest, NextResponse } from "next/server";
import { getDigitalAuditForResume } from "@/features/digital-audits/repository";
import {
  clearDigitalAuditCredential,
  readDigitalAuditCredential,
} from "@/features/digital-audits/security";

export async function GET(request: NextRequest) {
  try {
    const credential = readDigitalAuditCredential(request);
    if (!credential) return new NextResponse(null, { status: 204 });
    const audit = await getDigitalAuditForResume(credential.id, credential.tokenHash);
    if (!audit) {
      const response = new NextResponse(null, { status: 204 });
      clearDigitalAuditCredential(response);
      return response;
    }
    return NextResponse.json({ audit });
  } catch (error) {
    console.error("[digital-audits] resume failed:", error);
    return NextResponse.json(
      { message: "Saved progress could not be loaded." },
      { status: 500 },
    );
  }
}
