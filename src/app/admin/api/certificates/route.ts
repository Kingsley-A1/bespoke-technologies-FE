import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { DEFAULT_OWNERSHIP_STATEMENT } from "@/features/admin/certificates/constants";
import { createOwnershipCertificateDraft } from "@/features/admin/certificates/repository";

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid calendar date.");

export async function POST(request: Request) {
  const access = await assertAdminPermission("certificates.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({
    projectId: z.string().uuid().optional(),
    portfolioProjectId: z.string().trim().min(1).max(160).optional(),
    ownerKind: z.enum(["company", "contact", "other"]),
    ownerName: z.string().trim().min(2).max(180),
    ownerEmail: z.union([z.email(), z.literal("")]).optional(),
    ownerAddress: z.string().trim().max(500).optional(),
    ownershipStatement: z.string().trim().min(40).max(1200).default(DEFAULT_OWNERSHIP_STATEMENT),
    invoiceTotalIncludesTaxAndDiscounts: z.boolean().default(false),
    portfolioStartDate: isoDate.optional(),
    portfolioCompletionDate: isoDate.optional(),
    portfolioCommercialMode: z.enum(["paid", "free", "donation", "undisclosed"]).optional(),
    portfolioAmount: z.number().finite().min(0).max(1_000_000_000_000).optional(),
    portfolioCurrency: z.enum(["NGN", "USD", "GBP", "EUR"]).optional(),
    portfolioDisplayValuePublicly: z.boolean().default(false),
    portfolioValueNote: z.string().trim().max(240).optional(),
  }).superRefine((value, context) => {
    if (Boolean(value.projectId) === Boolean(value.portfolioProjectId)) {
      context.addIssue({
        code: "custom",
        message: "Choose one delivery project or portfolio project.",
        path: ["projectId"],
      });
    }
    if (value.portfolioProjectId) {
      if (!value.portfolioStartDate) {
        context.addIssue({ code: "custom", message: "Project start date is required.", path: ["portfolioStartDate"] });
      }
      if (!value.portfolioCompletionDate) {
        context.addIssue({ code: "custom", message: "Project completion date is required.", path: ["portfolioCompletionDate"] });
      }
      if (
        value.portfolioStartDate
        && value.portfolioCompletionDate
        && value.portfolioStartDate > value.portfolioCompletionDate
      ) {
        context.addIssue({ code: "custom", message: "Completion date cannot be earlier than the start date.", path: ["portfolioCompletionDate"] });
      }
      if (!value.portfolioCommercialMode) {
        context.addIssue({ code: "custom", message: "Commercial basis is required.", path: ["portfolioCommercialMode"] });
      }
      if (!value.portfolioCurrency) {
        context.addIssue({ code: "custom", message: "Currency is required.", path: ["portfolioCurrency"] });
      }
    }
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
