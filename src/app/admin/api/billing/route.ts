import { NextResponse } from "next/server";
import { assertAdminPermission, isSameOrigin } from "@/features/admin/access";
import { billingInputSchema } from "@/features/admin/billing/schema";
import { createBillingRecord, createClientRecord, createProjectRecord, getAdminSnapshot, issueBillingDocumentWithPayment } from "@/features/admin/repository";

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
    const depositReceived = invoiceInput.depositReceived;
    delete invoiceInput.clientName;
    delete invoiceInput.projectName;
    delete invoiceInput.depositReceived;
    const document = await createBillingRecord({ ...invoiceInput, clientId, projectId }, access.session);
    if (!depositReceived) return NextResponse.json({ document }, { status: 201 });
    // Issuing and taking money are separate authorities from preparing an
    // invoice, so both are demanded before either is exercised.
    for (const permission of ["billing.issue", "payments.record"] as const) {
      const granted = await assertAdminPermission(permission);
      if (!granted.ok) {
        return NextResponse.json(
          { document, depositError: `The invoice was saved as a draft. ${granted.error}` },
          { status: 201 },
        );
      }
    }
    try {
      await issueBillingDocumentWithPayment(document.id, depositReceived, access.session);
    } catch (error) {
      // The invoice exists and is recoverable, so it is returned with the
      // reason rather than reported as a failed save.
      const reason = error instanceof Error ? error.message : "The payment could not be recorded.";
      return NextResponse.json({ document, depositError: reason }, { status: 201 });
    }
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The invoice could not be saved." }, { status: 500 });
  }
}
