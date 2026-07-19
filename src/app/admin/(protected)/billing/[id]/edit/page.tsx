import { notFound, redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/access";
import { BillingEditor } from "@/features/admin/billing/billing-editor";
import { getAdminSnapshot } from "@/features/admin/repository";

export default async function EditBillingDraftPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPermission("billing.manage");
  const id = (await params).id;
  const snapshot = await getAdminSnapshot();
  const document = snapshot.documents.find((candidate) => candidate.id === id);
  if (!document) notFound();
  if (document.status !== "draft") redirect(`/admin/billing/${document.id}`);
  return <BillingEditor clients={snapshot.clients.filter((client) => client.state === "active")} projects={snapshot.projects} settings={snapshot.settings} initialDocument={document} />;
}
