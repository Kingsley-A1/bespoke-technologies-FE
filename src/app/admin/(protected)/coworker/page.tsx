import { BespokeAIPanel } from "@/components/ai";
import { requireAdminPermission } from "@/features/admin/access";

export default async function AdminCoworkerPage() {
  await requireAdminPermission("dashboard.view");
  return (
    <div className="-mx-4 -my-6 min-h-[calc(100dvh-86px)] sm:-mx-6 lg:-mx-8 lg:-my-8">
      <BespokeAIPanel mode="admin" />
    </div>
  );
}
