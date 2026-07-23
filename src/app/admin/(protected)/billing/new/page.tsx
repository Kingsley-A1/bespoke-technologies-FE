import { requireAdminPermission } from "@/features/admin/access";
import { BillingEditor } from "@/features/admin/billing/billing-editor";
import { getAdminSnapshot } from "@/features/admin/repository";
import { getInvoiceDraft } from "@/features/admin/billing/drafts";

export default async function NewBillingDocumentPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const session = await requireAdminPermission("billing.manage");
  const snapshot = await getAdminSnapshot();
  const draftId = (await searchParams).draft;
  const draft = draftId ? await getInvoiceDraft(draftId, session) : null;
  return <BillingEditor clients={snapshot.clients.filter((client) => client.state === "active")} projects={snapshot.projects} settings={snapshot.settings} initialDraft={draft ?? undefined} />;
}
