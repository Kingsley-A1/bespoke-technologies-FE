import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { billingInputSchema } from "@/features/admin/billing/schema";
import { createBillingRecord, createClientRecord, createProjectRecord, getAdminSnapshot } from "@/features/admin/repository";

export async function GET() {
  const access = await assertAdminPermission("billing.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  return NextResponse.json({ documents: (await getAdminSnapshot()).documents });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const access = await assertAdminPermission("billing.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }
  const parsed = billingInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the invoice fields." }, { status: 400 });
  try {
    let clientId = parsed.data.clientId;
    if (!clientId && parsed.data.clientName) {
      const client = await createClientRecord({ name: parsed.data.clientName, contactName: parsed.data.clientName, email: "", phone: "", address: "", currency: parsed.data.currency, paymentTermsDays: 14 }, access.session);
      clientId = client.id;
    }
    if (!clientId) throw new Error("A client is required.");
    let projectId = parsed.data.projectId;
    if (!projectId && parsed.data.projectName) {
      const project = await createProjectRecord({ clientId, name: parsed.data.projectName, service: "Invoice-linked project", summary: "Created while preparing an invoice.", status: "planned", health: "on_track", priority: "medium", commercialValue: 0, currency: parsed.data.currency }, access.session);
      projectId = project.id;
    }
    const invoiceInput = { ...parsed.data };
    delete invoiceInput.clientName;
    delete invoiceInput.projectName;
    const document = await createBillingRecord({ ...invoiceInput, clientId, projectId }, access.session);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The invoice could not be saved." }, { status: 500 });
  }
}
