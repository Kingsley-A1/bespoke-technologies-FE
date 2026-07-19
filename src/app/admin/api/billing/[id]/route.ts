import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { updateBillingDraft } from "@/features/admin/repository";

const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(600),
  quantity: z.number().positive().max(1_000_000),
  rate: z.number().min(0).max(1_000_000_000_000),
  discountRate: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100),
});

const inputSchema = z.object({
  type: z.enum(["standard", "proforma", "recurring"]),
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  issueDate: z.iso.date(),
  dueDate: z.iso.date(),
  currency: z.enum(["NGN", "USD", "GBP", "EUR"]),
  items: z.array(itemSchema).min(1).max(50),
  notes: z.string().trim().max(1200),
  terms: z.string().trim().max(1200),
  paymentInstructions: z.string().trim().max(1200),
  purchaseOrder: z.string().trim().max(120),
  recurrence: z.object({
    frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
    startDate: z.iso.date(),
    endDate: z.iso.date().optional(),
    nextRunDate: z.iso.date(),
    autoIssue: z.boolean(),
    state: z.enum(["draft", "active", "paused", "ended", "failed"]),
  }).optional(),
}).superRefine((value, context) => {
  if (value.type === "recurring" && !value.recurrence) context.addIssue({ code: "custom", message: "Choose a recurring schedule.", path: ["recurrence"] });
  if (value.type !== "recurring" && value.recurrence) context.addIssue({ code: "custom", message: "Only recurring templates can include a schedule.", path: ["recurrence"] });
  if (value.dueDate < value.issueDate) context.addIssue({ code: "custom", message: "Due date cannot be before issue date.", path: ["dueDate"] });
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("billing.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the document fields." }, { status: 400 });
  try {
    const document = await updateBillingDraft((await params).id, parsed.data, access.session);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The draft could not be updated.";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 409 });
  }
}
