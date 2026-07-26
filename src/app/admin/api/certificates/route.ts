import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { DEFAULT_OWNERSHIP_STATEMENT } from "@/features/admin/certificates/constants";
import { createOwnershipCertificateDraft } from "@/features/admin/certificates/repository";

export async function POST(request: Request) {
  const access = await assertAdminPermission("certificates.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({
    projectId: z.string().uuid(),
    ownerKind: z.enum(["company", "contact", "other"]),
    ownerName: z.string().trim().min(2).max(180),
    ownerEmail: z.union([z.email(), z.literal("")]).optional(),
    ownerAddress: z.string().trim().max(500).optional(),
    ownershipStatement: z.string().trim().min(40).max(1200).default(DEFAULT_OWNERSHIP_STATEMENT),
    invoiceTotalIncludesTaxAndDiscounts: z.boolean().default(false),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the certificate details." }, { status: 400 });
  try {
    const certificate = await createOwnershipCertificateDraft(parsed.data, access.session);
    return NextResponse.json({ ok: true, certificate }, { status: 201 });
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && String(error.code) === "23505";
    return NextResponse.json({ error: duplicate ? "This project already has an active certificate." : error instanceof Error ? error.message : "The certificate draft could not be created." }, { status: duplicate ? 409 : 400 });
  }
}
