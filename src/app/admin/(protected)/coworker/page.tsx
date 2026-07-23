import { BespokeAIPanel } from "@/components/ai";
import { requireAdminPermission } from "@/features/admin/access";

export default async function AdminCoworkerPage() {
  await requireAdminPermission("dashboard.view");
  return <BespokeAIPanel mode="admin" />;
}
