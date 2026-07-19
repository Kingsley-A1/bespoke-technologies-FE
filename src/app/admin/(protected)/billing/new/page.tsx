import { requireAdminPermission } from "@/features/admin/access";
import { BillingEditor } from "@/features/admin/billing/billing-editor";
import { getAdminSnapshot } from "@/features/admin/repository";

export default async function NewBillingDocumentPage() {
  await requireAdminPermission("billing.manage");
  const snapshot = await getAdminSnapshot();
  return <BillingEditor clients={snapshot.clients.filter((client) => client.state === "active")} projects={snapshot.projects} settings={snapshot.settings} />;
}
