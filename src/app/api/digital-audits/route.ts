import { NextRequest, NextResponse } from "next/server";
import { adminQuery } from "@/features/admin/db";
import { createDigitalAudit } from "@/features/digital-audits/repository";
import { createDigitalAuditSchema } from "@/features/digital-audits/schema";
import {
  assertDigitalAuditSameOrigin,
  createDigitalAuditToken,
  digitalAuditNetworkHash,
  hashDigitalAuditToken,
  setDigitalAuditCredential,
} from "@/features/digital-audits/security";
import { verifyTurnstile } from "@/lib/turnstile";

const MAX_CREATIONS_PER_HOUR = 10;

async function isRateLimited(request: Request) {
  const networkHash = digitalAuditNetworkHash(request);
  const result = await adminQuery<{ count: string }>(
    `SELECT count(*)::STRING AS count FROM digital_audit_submission_attempts
     WHERE network_hash=$1 AND attempted_at >= now() - INTERVAL '1 hour'`,
    [networkHash],
  );
  if (Number(result.rows[0]?.count ?? 0) >= MAX_CREATIONS_PER_HOUR) return true;
  await adminQuery(
    "INSERT INTO digital_audit_submission_attempts (network_hash) VALUES ($1)",
    [networkHash],
  );
  return false;
}

export async function POST(request: NextRequest) {
  try {
    assertDigitalAuditSameOrigin(request);
    if (await isRateLimited(request)) {
      return NextResponse.json(
        { message: "Too many audit sessions. Please try again later." },
        { status: 429 },
      );
    }
    const parsed = createDigitalAuditSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Check the business details." },
        { status: 400 },
      );
    }
    if (parsed.data.website) return new NextResponse(null, { status: 204 });
    const verified = await verifyTurnstile(
      parsed.data.turnstileToken,
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    );
    if (!verified) {
      return NextResponse.json(
        { message: "Verification failed. Refresh and try again." },
        { status: 400 },
      );
    }
    const resumeToken = createDigitalAuditToken();
    const audit = await createDigitalAudit({
      businessName: parsed.data.businessName,
      industry: parsed.data.industry,
      teamSize: parsed.data.teamSize,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      contactConsent: parsed.data.contactConsent,
      shareBusinessName: parsed.data.shareBusinessName,
      source: parsed.data.source,
      attribution: parsed.data.attribution,
      resumeTokenHash: hashDigitalAuditToken(resumeToken),
    });
    const response = NextResponse.json({ audit }, { status: 201 });
    setDigitalAuditCredential(response, audit.id, resumeToken);
    return response;
  } catch (error) {
    console.error("[digital-audits] create failed:", error);
    return NextResponse.json(
      { message: "The audit could not be started. Please try again." },
      { status: 500 },
    );
  }
}
